#!/usr/bin/env python3
"""Clean the photo lists in birds/data/species.json.

Each photo is judged by its file name, caption and Commons metadata. Non-photos
(eggs, specimens, drawings, maps, stamps, ...) are dropped. Photos whose name
contains the scientific or common name rank first, then male/female-tagged
photos, then the rest. Up to MAX_PHOTOS photos are kept, followed by at most
one range map (never first). Species left with no usable photo are searched on
Wikimedia Commons. Untagged photos get a sex tag when Commons metadata has one.

Usage:
  python3 birds/scripts/clean_photos.py [--report PATH]
"""
import argparse
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / "birds" / "data" / "species.json"
COMMONS_API = "https://commons.wikimedia.org/w/api.php?"
USER_AGENT = "BharatpurBirdsSite/1.0 (pippagg)"
MIN_INTERVAL = 0.5  # about 2 requests per second
MAX_RETRIES = 4
MAX_PHOTOS = 6
SEARCH_LIMIT = 30
PHOTO_EXTS = ("jpg", "jpeg", "png", "webp")
MAP_EXTS = PHOTO_EXTS + ("svg",)
FREE_LICENSE_RE = re.compile(r"^(cc|public domain|pd\b|gfdl|cc0)", re.IGNORECASE)

# Matched against normalised text (underscores, dashes and dots turned into spaces).
NON_PHOTO_RE = re.compile(
    r"\b(eggs?|nests?|specimens?|museums?|skins?|skulls?|skeletons?|mounted|"
    r"taxiderm\w*|drawings?|illustrations?|paintings?|plates?|lithographs?|engravings?|"
    r"hieroglyphs?\w*|reliefs?|stamps?|coins?|banknotes?|postage|sonograms?|sonographs?|"
    r"spectrograms?|spectrogr\w*|distributions?|feathers?|logos?|sketch\w*|artwork|"
    r"frescos?|murals?|sculptures?|statues?|figurines?|carvings?|mosaics?|pottery|"
    r"diagrams?|charts?|graphs?|bones?|postcards?|svg)\b"
)
MAP_FILENAME_RE = re.compile(r"\b(maps?|ranges?|distribution)\b")
MAP_CAPTION_RE = re.compile(r"\bmaps?\b|\brange maps?\b")
MALE_RE = re.compile(r"\bmales?\b|\u2642")
FEMALE_RE = re.compile(r"\bfemales?\b|\u2640")

_last_request = [0.0]


def norm(value):
    """Lower-case text with separators turned into spaces, so \\b works on file names."""
    return " ".join(re.sub(r"[_\-.()\[\]]+", " ", (value or "").lower()).split())


def clean_text(value):
    value = re.sub(r"<[^>]+>", "", value or "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def api_get(params):
    url = COMMONS_API + urllib.parse.urlencode({**params, "format": "json", "formatversion": 2})
    for attempt in range(MAX_RETRIES):
        wait = MIN_INTERVAL - (time.monotonic() - _last_request[0])
        if wait > 0:
            time.sleep(wait)
        _last_request[0] = time.monotonic()
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as err:
            if err.code not in (429, 500, 502, 503, 504) or attempt == MAX_RETRIES - 1:
                raise
            retry_after = err.headers.get("Retry-After", "")
            delay = float(retry_after) if retry_after.isdigit() else 10 * 2**attempt
            print(f"  HTTP {err.code}, backing off {delay:.0f}s", flush=True)
            time.sleep(delay)
        except urllib.error.URLError:
            if attempt == MAX_RETRIES - 1:
                raise
            time.sleep(5 * 2**attempt)
    raise RuntimeError("unreachable")


def file_name(photo):
    source = photo.get("source") or ""
    if "/File:" in source:
        return urllib.parse.unquote(source.rsplit("/File:", 1)[-1])
    return urllib.parse.unquote((photo.get("url") or "").split("?")[0].rsplit("/", 1)[-1])


def extension(name):
    return name.rsplit(".", 1)[-1].lower() if "." in name else ""


def is_non_photo(filename, caption):
    fn, cap = norm(filename), norm(caption)
    return bool(
        NON_PHOTO_RE.search(fn)
        or NON_PHOTO_RE.search(cap)
        or MAP_FILENAME_RE.search(fn)
        or MAP_CAPTION_RE.search(cap)
    )


def detect_sex(*texts):
    text = " ".join(norm(t) for t in texts if t)
    female = bool(FEMALE_RE.search(text))
    male = bool(MALE_RE.search(text))
    if female and not male:
        return "female"
    if male and not female:
        return "male"
    return None


def name_score(species, filename, caption):
    """Higher when the file or caption names the species (3 scientific in file, 2 scientific in caption, ...)."""
    fn, cap = f" {norm(filename)} ", f" {norm(caption)} "
    sci = norm(species.get("scientific"))
    common = norm(species.get("common"))
    score = 0
    if sci and f" {sci} " in fn:
        score += 3
    elif sci and f" {sci} " in cap:
        score += 2
    elif sci and f" {sci.split()[0]} " in fn:
        score += 1
    if common and f" {common} " in fn:
        score += 2
    elif common and f" {common} " in cap:
        score += 1
    return score


def fetch_metadata(titles):
    """Return {title: imageinfo} for Commons file titles, in batches of 50."""
    found = {}
    for start in range(0, len(titles), 50):
        batch = titles[start : start + 50]
        data = api_get(
            {
                "action": "query",
                "prop": "imageinfo",
                "iiprop": "url|extmetadata",
                "titles": "|".join(batch),
            }
        )
        for page in data.get("query", {}).get("pages", []):
            if page.get("imageinfo"):
                found[page["title"].replace("_", " ")] = page["imageinfo"][0]
    return found


def search_commons(species):
    data = api_get(
        {
            "action": "query",
            "generator": "search",
            "gsrnamespace": 6,
            "gsrsearch": f"{species['scientific']} filetype:bitmap",
            "gsrlimit": SEARCH_LIMIT,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "iiurlwidth": 640,
        }
    )
    pages = sorted(data.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0))
    return [(p["title"], p["imageinfo"][0]) for p in pages if p.get("imageinfo")]


def photo_from_info(title, info):
    filename = title[len("File:") :]
    meta = info.get("extmetadata", {})
    description = clean_text(meta.get("ImageDescription", {}).get("value"))
    object_name = clean_text(meta.get("ObjectName", {}).get("value"))
    caption = (description or object_name)[:300] or filename.rsplit(".", 1)[0].replace("_", " ")
    return {
        "url": (info.get("thumburl") or info.get("url", "")).split("?")[0],
        "full": (info.get("url") or "").split("?")[0],
        "caption": caption,
        "sex": detect_sex(filename, description, object_name),
        "type": "photo",
        "credit": clean_text(meta.get("Artist", {}).get("value")) or None,
        "license": clean_text(meta.get("LicenseShortName", {}).get("value")),
        "source": info.get("descriptionurl"),
    }


def replacement_photos(species):
    """Freely licensed Commons photos naming the species, best first."""
    scored = []
    for title, info in search_commons(species):
        filename = title[len("File:") :]
        if extension(filename) not in PHOTO_EXTS or not info.get("thumburl"):
            continue
        photo = photo_from_info(title, info)
        if is_non_photo(filename, photo["caption"]) or not FREE_LICENSE_RE.match(photo["license"]):
            continue
        score = name_score(species, filename, photo["caption"])
        if score >= 2:
            scored.append((-score, 0 if photo["sex"] else 1, len(scored), photo))
    scored.sort(key=lambda item: item[:3])
    return [item[3] for item in scored[:MAX_PHOTOS]]


def clean_species(species, metadata, fetch_missing):
    """Return (new photo list, whether the species needed a Commons replacement)."""
    photos, maps = [], []
    for index, photo in enumerate(species.get("photos") or []):
        filename = file_name(photo)
        if photo.get("type") == "map":
            if extension(filename) in MAP_EXTS:
                maps.append(photo)
            continue
        if extension(filename) not in PHOTO_EXTS or is_non_photo(filename, photo.get("caption")):
            continue
        photos.append((index, photo))

    ranked = []
    for index, photo in photos:
        filename = file_name(photo)
        if photo.get("sex") is None:
            info = metadata.get("File:" + filename.replace("_", " "), {})
            meta = info.get("extmetadata", {})
            photo["sex"] = detect_sex(
                filename,
                meta.get("ImageDescription", {}).get("value"),
                meta.get("ObjectName", {}).get("value"),
            )
        score = name_score(species, filename, photo.get("caption"))
        ranked.append((-score, 0 if photo["sex"] else 1, index, photo))
    ranked.sort(key=lambda item: item[:3])
    kept = [item[3] for item in ranked[:MAX_PHOTOS]]

    replaced = False
    if not kept and fetch_missing:
        kept = replacement_photos(species)
        replaced = bool(kept)

    maps.sort(key=lambda p: -name_score(species, file_name(p), p.get("caption")))
    result = kept + (maps[:1] if kept else [])
    return result, replaced


def count_tags(species_list):
    male = sum(1 for s in species_list for p in s["photos"] if p.get("sex") == "male")
    female = sum(1 for s in species_list for p in s["photos"] if p.get("sex") == "female")
    return male, female


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--report", default="/tmp/clean_photos_report.json", help="where to write the JSON report")
    args = parser.parse_args()

    species_list = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    before = {s["id"]: [dict(p) for p in s.get("photos") or []] for s in species_list}
    male_before, female_before = count_tags(species_list)

    # Pass 1: look up Commons metadata for untagged photos that could be kept, so sex can be read from it.
    untagged = {}
    for species in species_list:
        for photo in species.get("photos") or []:
            filename = file_name(photo)
            if (
                photo.get("type") != "map"
                and photo.get("sex") is None
                and extension(filename) in PHOTO_EXTS
                and not is_non_photo(filename, photo.get("caption"))
            ):
                untagged["File:" + filename] = True
    print(f"Fetching Commons metadata for {len(untagged)} untagged photos...", flush=True)
    metadata = fetch_metadata(list(untagged))

    # Pass 2: rank, filter and replace.
    replaced, no_photo, cover_changed = [], [], []
    for number, species in enumerate(species_list, 1):
        old_cover = next((p["url"] for p in before[species["id"]] if p.get("type") != "map"), None)
        photos, did_replace = clean_species(species, metadata, fetch_missing=True)
        species["photos"] = photos
        if did_replace:
            replaced.append(species["common"])
        if not any(p.get("type") != "map" for p in photos):
            no_photo.append(species["common"])
        new_cover = next((p["url"] for p in photos if p.get("type") != "map"), None)
        if new_cover != old_cover:
            cover_changed.append(species["common"])
        if number % 50 == 0:
            print(f"  {number}/{len(species_list)}", flush=True)

    male_after, female_after = count_tags(species_list)
    DATA_PATH.write_text(json.dumps(species_list, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    report = {
        "covers_changed": cover_changed,
        "replaced_from_commons": replaced,
        "no_photo": no_photo,
        "tags_before": {"male": male_before, "female": female_before},
        "tags_after": {"male": male_after, "female": female_after},
    }
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"covers changed: {len(cover_changed)}")
    print(f"replaced from Commons: {len(replaced)}")
    print(f"no photo left: {len(no_photo)} {no_photo}")
    print(f"male/female tags: {male_before}/{female_before} -> {male_after}/{female_after}")
    print(f"report: {args.report}")


if __name__ == "__main__":
    main()
