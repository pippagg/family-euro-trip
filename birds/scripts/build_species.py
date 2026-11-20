#!/usr/bin/env python3
"""Build birds/data/species.json for Keoladeo National Park (Bharatpur).

Stages:
  1. Parse the Avibase checklist text (Howard & Moore order).
  2. Match each species to the eBird taxonomy (speciesCode, links).
  3. Enrich with English Wikipedia text and Wikimedia Commons photos.

API responses are cached under CACHE_DIR so reruns are cheap. Wikipedia
section text is written to RAW_DIR/<id>.json for later summarising.

Usage:
  python3 birds/scripts/build_species.py --parse-only
  python3 birds/scripts/build_species.py
"""
import argparse
import difflib
import hashlib
import html
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = Path("/tmp/avibase.txt")
OUT_PATH = ROOT / "birds" / "data" / "species.json"
CACHE_DIR = Path("/tmp/birdcache")
RAW_DIR = Path("/tmp/birdraw")

USER_AGENT = "BharatpurBirdsSite/1.0 (pippagg)"
MIN_INTERVAL = 0.5  # about 2 requests per second
EBIRD_TAXONOMY_URL = "https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=en"
WIKI_API = "https://en.wikipedia.org/w/api.php?format=json&formatversion=2&"
COMMONS_HOST = "commons.wikimedia.org"
MAX_PHOTOS = 6
EXPECTED_SPECIES = 457

# PDF text artifacts, applied before parsing.
TEXT_FIXES = {"leschenaul tii": "leschenaultii"}
REFERENCES_END = "http://delhibird.net [Distribution]"
# Avibase (Howard & Moore) names that differ from eBird/Clements names.
SCI_ALIASES = {
    "Francolinus pondicerianus": "Ortygornis pondicerianus",
    "Streptopelia chinensis": "Spilopelia chinensis",
    "Bubulcus ibis": "Ardea coromanda",
    "Charadrius mongolus": "Anarhynchus mongolus",
    "Accipiter gentilis": "Astur gentilis",
    "Bubo coromandus": "Ketupa coromanda",
    "Dendrocopos nanus": "Yungipicus nanus",
    "Dendrocopos moluccensis": "Yungipicus nanus",
    "Mirafra cantillans": "Mirafra javanica",
    "Chaetornis striata": "Schoenicola striatus",
    "Seicercus burkii": "Phylloscopus burkii",
    "Seicercus whistleri": "Phylloscopus whistleri",
    "Seicercus nitidus": "Phylloscopus nitidus",
    "Seicercus trochiloides": "Phylloscopus trochiloides",
    "Seicercus occipitalis": "Phylloscopus occipitalis",
}
COMMON_ALIASES = {}

FAMILY_RE = re.compile(r"^([A-Z][A-Z-]+(?: [A-Z-]+)*): ([A-Z][a-z]+)$")
SPECIES_RE = re.compile(
    r"^(?P<eng>[A-Z].*?)\s+(?P<gen>[A-Z][a-z]+)\s+(?P<sp>[a-z][a-z-]*)(?:\s+(?P<tail>.*))?$"
)
JUNK_RE = re.compile(r"^(\d{2}/\d{2}/\d{4}.*|Page \d+ of \d+|\d{2}:\d{2}|-+.*)$")
STATUS_ONLY_RE = re.compile(
    r"^(Critically endangered|Endangered|Vulnerable|Near-threatened|Rare/Accidental"
    r"|Endemic \(country/region\)|Accidental|Rare)$"
)
IUCN_RE = re.compile(
    r"\b(Critically endangered|Endangered|Vulnerable|Near-threatened|Extinct in the wild|Extinct)\b",
    re.IGNORECASE,
)
RARITY_RE = re.compile(r"Rare/Accidental|Rare|Accidental|Vagrant|Hypothetical|Endemic \(country/region\)")

BAD_NAME_RE = re.compile(
    r"icon|flag|logo|wiki|question|edit|symbol|speaker|padlock|stub|ambox|disambig"
    r"|nuvola|crystal|portal|pictogram|emblem|arrow|commons",
    re.IGNORECASE,
)
MAP_NAME_RE = re.compile(r"(^|[^a-z])(map|range|distribution)([^a-z]|$)", re.IGNORECASE)
SEX_FEMALE_RE = re.compile(r"\bfemales?\b", re.IGNORECASE)
SEX_MALE_RE = re.compile(r"\bmales?\b", re.IGNORECASE)
HEADING_RE = re.compile(r"^(={2,6})\s*(.+?)\s*\1$")

_last_request = [0.0]


def fetch_json(url):
    """GET a JSON URL with throttling, retries and on-disk caching. Returns None on 404."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha1(url.encode()).hexdigest()
    path = CACHE_DIR / f"{key}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    for attempt in range(7):
        wait = MIN_INTERVAL - (time.time() - _last_request[0])
        if wait > 0:
            time.sleep(wait)
        _last_request[0] = time.time()
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            path.write_text(json.dumps(data), encoding="utf-8")
            return data
        except urllib.error.HTTPError as err:
            if err.code == 404:
                return None
            if err.code in (429, 500, 502, 503, 504) and attempt < 6:
                retry_after = err.headers.get("Retry-After", "")
                delay = int(retry_after) if retry_after.isdigit() else 30 * (2 ** attempt)
                print(f"HTTP {err.code}; backing off {delay}s", file=sys.stderr, flush=True)
                time.sleep(delay)
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if attempt < 6:
                time.sleep(2 ** (attempt + 1))
                continue
            raise
    raise RuntimeError(f"giving up on {url}")


def wiki_get(query):
    return fetch_json(WIKI_API + query)


def quote(value):
    return urllib.parse.quote(value, safe="")


def clean_text(value):
    value = re.sub(r"<[^>]+>", "", value or "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def slugify(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower().replace("'", "")).strip("-")


def parse_tail(tail):
    """Split the text after the scientific name into IUCN status, rarity and local name."""
    tail = tail or ""
    status = None
    iucn = IUCN_RE.search(tail)
    if iucn:
        status = iucn.group(1)[0].upper() + iucn.group(1)[1:].lower()
    rarity_tokens = []
    for token in RARITY_RE.findall(tail):
        if token not in rarity_tokens:
            rarity_tokens.append(token)
    local = IUCN_RE.sub("", tail)
    local = RARITY_RE.sub("", local)
    local = re.sub(r"\s+", " ", local).strip()
    return status, "/".join(rarity_tokens) or None, local or None


def parse_checklist(text):
    """Return (species list, warnings). Each species has order, family, common, scientific, local_name, status, rarity."""
    for old, new in TEXT_FIXES.items():
        text = text.replace(old, new)
    entries = []
    warnings = []
    order = family = None
    pending = ""
    in_references = False
    for raw in text.splitlines():
        line = raw.strip()
        # The PDF places a references block mid-list (before the Turdidae rows).
        if line.startswith("References (partial list)"):
            in_references = True
            continue
        if in_references:
            in_references = line != REFERENCES_END
            continue
        if line.startswith("Avibase has been visited"):
            break
        if not line or JUNK_RE.match(line):
            continue
        header = FAMILY_RE.match(line)
        if header:
            order, family = header.group(1), header.group(2)
            pending = ""
            continue
        if family is None:
            continue
        if not pending and entries:
            # Wrapped status ("Vulnerable") or local-name continuation ("kuruvi", Devanagari).
            if STATUS_ONLY_RE.match(line) or not re.match(r"[A-Z]", line):
                entries[-1]["tail"] += " " + line
                continue
        pending = f"{pending} {line}".strip()
        match = SPECIES_RE.match(pending)
        if match:
            entries.append(
                {
                    "order": order,
                    "family": family,
                    "common": match.group("eng").strip(),
                    "scientific": f"{match.group('gen')} {match.group('sp')}",
                    "tail": match.group("tail") or "",
                }
            )
            pending = ""
    if pending:
        warnings.append(f"unparsed trailing text: {pending!r}")

    species = []
    for entry in entries:
        status, rarity, local = parse_tail(entry["tail"])
        species.append(
            {
                "order": entry["order"],
                "family": entry["family"],
                "common": entry["common"],
                "scientific": entry["scientific"],
                "local_name": local,
                "status": status,
                "rarity": rarity,
            }
        )
    return species, warnings


def load_ebird_index():
    taxonomy = fetch_json(EBIRD_TAXONOMY_URL)
    by_sci, by_common = {}, {}
    for item in taxonomy:
        if item.get("category") != "species":
            continue
        by_sci.setdefault(item["sciName"].lower(), item)
        by_common.setdefault(item["comName"].lower(), item)
    return by_sci, by_common


def match_ebird(species, by_sci, by_common):
    sci = SCI_ALIASES.get(species["scientific"], species["scientific"])
    if sci.lower() in by_sci:
        return by_sci[sci.lower()], "scientific"
    common = COMMON_ALIASES.get(species["common"], species["common"])
    if common.lower() in by_common:
        return by_common[common.lower()], "common"
    close = difflib.get_close_matches(sci.lower(), list(by_sci), n=1, cutoff=0.88)
    if close:
        return by_sci[close[0]], "fuzzy"
    return None, None


def fetch_wikipedia_page(names):
    """Return the first non-disambiguation English Wikipedia page for the given titles, or None."""
    for name in names:
        data = wiki_get(
            "action=query&redirects=1&prop=extracts|pageprops|pageimages|info"
            "&explaintext=1&exsectionformat=wiki&ppprop=disambiguation&piprop=name"
            "&inprop=url&titles=" + quote(name)
        )
        pages = data["query"]["pages"]
        if not pages or pages[0].get("missing"):
            continue
        page = pages[0]
        if "disambiguation" in page.get("pageprops", {}):
            continue
        return page
    return None


def split_sections(extract):
    """Split a plain-text Wikipedia extract into (intro, {heading: text})."""
    intro, sections, current = [], {}, None
    for line in extract.splitlines():
        heading = HEADING_RE.match(line.strip())
        if heading:
            current = heading.group(2)
            sections.setdefault(current, [])
            continue
        if current is None:
            intro.append(line)
        else:
            sections[current].append(line)
    clean = lambda lines: "\n".join(lines).strip()
    return clean(intro), {k: clean(v) for k, v in sections.items() if clean(v)}


def make_summary(intro):
    paragraphs = [re.sub(r"\s+", " ", p).strip() for p in intro.split("\n\n") if p.strip()]
    text = " ".join(paragraphs[:2])
    if len(text) > 700:
        cut = text[:700].rfind(". ")
        text = text[: cut + 1] if cut > 200 else text[:700].rstrip() + "..."
    return text or None


def usable_photo_name(name):
    lower = name.lower()
    ext = lower.rsplit(".", 1)[-1] if "." in lower else ""
    if BAD_NAME_RE.search(lower):
        return False
    if ext == "svg":
        return bool(MAP_NAME_RE.search(lower))
    return ext in ("jpg", "jpeg", "png", "webp")


def detect_sex(*texts):
    text = " ".join(t for t in texts if t)
    female = bool(SEX_FEMALE_RE.search(text))
    male = bool(SEX_MALE_RE.search(text))
    if female and not male:
        return "female"
    if male and not female:
        return "male"
    return None


def build_photos(title, lead_name):
    """Return up to MAX_PHOTOS Commons photos (lead image first) plus at most one range map."""
    data = wiki_get("action=query&prop=images&imlimit=500&titles=" + quote(title))
    page = data["query"]["pages"][0]
    names = [img["title"] for img in page.get("images", [])]
    candidates = [n for n in names if usable_photo_name(n[len("File:"):])]
    lead = f"File:{lead_name}" if lead_name else None
    if lead in candidates:
        candidates.remove(lead)
        candidates.insert(0, lead)

    infos = {}
    for start in range(0, len(candidates), 50):
        batch = candidates[start : start + 50]
        info = wiki_get(
            "action=query&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=640"
            "&titles=" + quote("|".join(batch))
        )
        for item in info["query"]["pages"]:
            if item.get("imageinfo"):
                infos[item["title"]] = item["imageinfo"][0]

    photos, maps = [], []
    for name in candidates:
        image = infos.get(name)
        if not image or COMMONS_HOST not in image.get("descriptionurl", ""):
            continue
        meta = image.get("extmetadata", {})
        license_name = clean_text(meta.get("LicenseShortName", {}).get("value"))
        thumb = image.get("thumburl")
        if not license_name or not thumb:
            continue
        thumb = thumb.split("?")[0]
        original = (image.get("url") or "").split("?")[0]
        filename = name[len("File:"):]
        caption = clean_text(meta.get("ImageDescription", {}).get("value")) or clean_text(
            meta.get("ObjectName", {}).get("value")
        )
        caption = caption[:300] or filename.rsplit(".", 1)[0].replace("_", " ")
        is_map = bool(MAP_NAME_RE.search(filename))
        photo = {
            "url": thumb,
            "full": original,
            "caption": caption,
            "sex": detect_sex(filename, caption),
            "type": "map" if is_map else "photo",
            "credit": clean_text(meta.get("Artist", {}).get("value")) or None,
            "license": license_name,
            "source": image.get("descriptionurl"),
        }
        (maps if is_map else photos).append(photo)

    result = photos[:MAX_PHOTOS]
    if maps:
        result.append(maps[0])
    return result


def build_links(scientific, code, wiki_url):
    return {
        "avibase": "https://avibase.bsc-eoc.org/search.jsp?lang=EN&qstr="
        + urllib.parse.quote_plus(scientific),
        "bow": f"https://birdsoftheworld.org/bow/species/{code}/cur/introduction" if code else None,
        "ebird": f"https://ebird.org/species/{code}" if code else None,
        "macaulay": f"https://search.macaulaylibrary.org/catalog?taxonCode={code}&mediaType=photo"
        if code
        else None,
        "wikipedia": wiki_url,
        "xenocanto": "https://xeno-canto.org/species/" + scientific.replace(" ", "-"),
    }


def enrich(species, by_sci, by_common):
    """Build one output record. Returns (record, match_kind, has_wiki)."""
    ebird, match_kind = match_ebird(species, by_sci, by_common)
    code = ebird["speciesCode"] if ebird else None

    names = [SCI_ALIASES.get(species["scientific"], species["scientific"]), species["common"]]
    page = fetch_wikipedia_page(list(dict.fromkeys(names)))
    intro, sections, wiki_url, summary, photos = "", {}, None, None, []
    if page:
        intro, sections = split_sections(page.get("extract", ""))
        wiki_url = page.get("fullurl")
        summary = make_summary(intro)
        photos = build_photos(page["title"], page.get("pageimage"))

    slug = slugify(species["common"])
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    (RAW_DIR / f"{slug}.json").write_text(
        json.dumps(
            {
                "common": species["common"],
                "scientific": species["scientific"],
                "wikipedia_title": page.get("title") if page else None,
                "url": wiki_url,
                "intro": intro,
                "sections": sections,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    record = {
        "id": slug,
        "order": species["order"],
        "family": species["family"],
        "common": species["common"],
        "scientific": species["scientific"],
        "local_name": species["local_name"],
        "status": species["status"],
        "rarity": species["rarity"],
        "ebird_code": code,
        "links": build_links(species["scientific"], code, wiki_url),
        "summary": summary,
        "photos": photos,
        "male": None,
        "female": None,
        "where_found": None,
        "habitat": None,
        "size": None,
    }
    return record, match_kind, page is not None


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--parse-only", action="store_true", help="only parse the checklist and print it")
    parser.add_argument("--limit", type=int, default=None, help="enrich only the first N species (debugging)")
    args = parser.parse_args()

    text = Path(args.input).read_text(encoding="utf-8")
    species, warnings = parse_checklist(text)
    print(f"parsed {len(species)} species (expected {EXPECTED_SPECIES})")
    for warning in warnings:
        print("WARNING:", warning)
    if args.parse_only:
        for item in species:
            print(
                f"{item['order']} | {item['family']} | {item['common']} | {item['scientific']} "
                f"| {item['status']} | {item['rarity']} | {item['local_name']}"
            )
        return 0

    by_sci, by_common = load_ebird_index()
    subset = species[: args.limit] if args.limit else species
    records = []
    ebird_kinds = {"scientific": 0, "common": 0, "fuzzy": 0}
    wiki_count = photo_species = sex_species = 0
    unmatched = []
    for index, item in enumerate(subset, 1):
        record, kind, has_wiki = enrich(item, by_sci, by_common)
        if kind:
            ebird_kinds[kind] += 1
        else:
            unmatched.append(item["common"])
        wiki_count += has_wiki
        photo_species += any(p["type"] == "photo" for p in record["photos"])
        sex_species += any(p["sex"] in ("male", "female") for p in record["photos"])
        records.append(record)
        print(f"[{index}/{len(subset)}] {item['common']}: ebird={kind or 'NONE'} wiki={has_wiki} photos={len(record['photos'])}", flush=True)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"\nspecies: {len(records)}")
    print(f"eBird matched: {sum(ebird_kinds.values())} (scientific {ebird_kinds['scientific']}, common {ebird_kinds['common']}, fuzzy {ebird_kinds['fuzzy']})")
    print(f"Wikipedia articles: {wiki_count}")
    print(f"with >=1 photo: {photo_species}")
    print(f"with male/female tagged photo: {sex_species}")
    print(f"unmatched eBird: {unmatched}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
