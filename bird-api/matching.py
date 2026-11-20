import json
import re
import unicodedata
from pathlib import Path

from rapidfuzz import fuzz, process

# Model (BirdNET) scientific name -> Howard & Moore name used by the checklist
# Checklist ebird_code -> model scientific name, for cases taxonomy lookups can't resolve
OVERRIDES = {
    "purswa1": "Porphyrio poliocephalus",
    "webowl1": "Tyto javanica",
    "chbnut2": "Sitta cinnamoventris",
    "scamin3": "Pericrocotus speciosus",
}

TAXONOMY_PATH = Path(__file__).parent / "data" / "ebird_taxonomy.json"

SYNONYMS = {
    "Anas querquedula": "Spatula querquedula",
    "Anas clypeata": "Spatula clypeata",
    "Anas strepera": "Mareca strepera",
    "Anas penelope": "Mareca penelope",
    "Anas falcata": "Mareca falcata",
    "Porzana fusca": "Zapornia fusca",
    "Porzana pusilla": "Zapornia pusilla",
    "Porzana parva": "Zapornia parva",
    "Taccocua leschenaultii": "Taccocua leschenaultii",
    "Accipiter badius": "Tachyspiza badia",
    "Tachyspiza badia": "Accipiter badius",
    "Accipiter gentilis": "Astur gentilis",
    "Astur gentilis": "Accipiter gentilis",
    "Dendrocygna javanica": "Dendrocygna javanica",
    "Aythya nyroca": "Aythya nyroca",
    "Motacilla alba": "Motacilla alba",
    "Corvus splendens": "Corvus splendens",
    "Saxicoloides fulicatus": "Copsychus fulicatus",
    "Copsychus fulicatus": "Saxicoloides fulicatus",
    "Hirundo daurica": "Cecropis daurica",
    "Cecropis daurica": "Hirundo daurica",
    "Hirundo rustica": "Hirundo rustica",
    "Phylloscopus collybita": "Phylloscopus collybita",
    "Sylvia curruca": "Curruca curruca",
    "Curruca curruca": "Sylvia curruca",
    "Sylvia communis": "Curruca communis",
    "Curruca communis": "Sylvia communis",
    "Sylvia nana": "Curruca nana",
    "Chrysomma sinense": "Chrysomma sinense",
    "Turdoides caudata": "Argya caudata",
    "Argya caudata": "Turdoides caudata",
    "Turdoides malcolmi": "Argya malcolmi",
    "Argya malcolmi": "Turdoides malcolmi",
    "Turdoides striata": "Argya striata",
    "Argya striata": "Turdoides striata",
    "Hypothymis azurea": "Hypothymis azurea",
    "Ardeola grayii": "Ardeola grayii",
    "Bubulcus ibis": "Ardea ibis",
    "Ardea ibis": "Bubulcus ibis",
    "Egretta garzetta": "Egretta garzetta",
    "Casmerodius albus": "Ardea alba",
    "Ardea alba": "Ardea alba",
    "Mesophoyx intermedia": "Ardea intermedia",
    "Ardea intermedia": "Mesophoyx intermedia",
    "Tringa hypoleucos": "Actitis hypoleucos",
    "Actitis hypoleucos": "Tringa hypoleucos",
    "Carpodacus erythrinus": "Carpodacus erythrinus",
    "Perdicula asiatica": "Perdicula asiatica",
    "Dinopium benghalense": "Dinopium benghalense",
    "Merops persicus": "Merops persicus",
    "Streptopelia chinensis": "Spilopelia chinensis",
    "Spilopelia chinensis": "Streptopelia chinensis",
    "Streptopelia senegalensis": "Spilopelia senegalensis",
    "Spilopelia senegalensis": "Streptopelia senegalensis",
    "Centropus sinensis": "Centropus sinensis",
    "Dicrurus macrocercus": "Dicrurus macrocercus",
    "Phalacrocorax fuscicollis": "Phalacrocorax fuscicollis",
    "Microcarbo niger": "Phalacrocorax niger",
    "Phalacrocorax niger": "Microcarbo niger",
    "Microcarbo pygmaeus": "Phalacrocorax pygmeus",
    "Larus cachinnans": "Larus cachinnans",
    "Chroicocephalus ridibundus": "Larus ridibundus",
    "Hydroprogne caspia": "Sterna caspia",
    "Sterna caspia": "Hydroprogne caspia",
    "Sterna aurantia": "Sterna aurantia",
    "Rynchops albicollis": "Rynchops albicollis",
}


def norm_common(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[-'’/]", " ", s)
    s = re.sub(r"[^a-z ]", "", s)
    return re.sub(r"\s+", " ", s).strip()


def parse_label(label: str):
    sci, _, common = label.strip().partition("_")
    return sci.strip(), common.strip()


def _sci(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())


RANK = {"override": 0, "scientific": 1, "ebird": 2, "synonym": 3, "common": 4, "epithet": 5}


class Checklist:
    def __init__(self, species: list[dict], taxonomy: list | None = None):
        self.species = species
        self.by_sci = {_sci(s["scientific"]).lower(): s for s in species}
        self.by_ebird = {s["ebird_code"]: s for s in species if s.get("ebird_code")}
        self.by_common = {}
        for s in species:
            self.by_common.setdefault(norm_common(s["common"]), s)
        self.by_epithet: dict[str, list[dict]] = {}
        for s in species:
            self.by_epithet.setdefault(_sci(s["scientific"]).split(" ")[-1].lower(), []).append(s)
        taxonomy = taxonomy or []
        self.tax_sci = {a.lower(): c for a, _, c in taxonomy}
        self.tax_common = {norm_common(b): c for _, b, c in taxonomy}

    @classmethod
    def load(cls, path: Path):
        try:
            tax = json.loads(TAXONOMY_PATH.read_text())
        except (OSError, ValueError):
            tax = []
        if not Path(path).exists():
            return cls([], tax)
        return cls(json.loads(Path(path).read_text()), tax)

    def candidate(self, scientific: str, common: str):
        """Best (species | None, method) for one label, ignoring collisions."""
        key = _sci(scientific).lower()
        for code, sci in OVERRIDES.items():
            if sci.lower() == key and code in self.by_ebird:
                return self.by_ebird[code], "override"
        if key in self.by_sci:
            return self.by_sci[key], "scientific"
        code = self.tax_sci.get(key) or self.tax_common.get(norm_common(common))
        if code in self.by_ebird:
            return self.by_ebird[code], "ebird"
        syn = SYNONYMS.get(_sci(scientific))
        if syn and syn.lower() in self.by_sci:
            return self.by_sci[syn.lower()], "synonym"
        nc = norm_common(common)
        if nc in self.by_common:
            return self.by_common[nc], "common"
        parts = key.split(" ")
        if len(parts) >= 2:
            best = None
            for c in self.by_epithet.get(parts[-1], []):
                g = fuzz.ratio(parts[0], _sci(c["scientific"]).split(" ")[0].lower())
                n = fuzz.ratio(nc, norm_common(c["common"]))
                if (g >= 80 or n >= 85) and (best is None or n > best[0]):
                    best = (n, c)
            if best:
                return best[1], "epithet"
        return None, "none"

    def match_all(self, labels: list[tuple[str, str]]):
        """Match every label; a checklist species goes only to its best-ranked label."""
        cands = [self.candidate(s, c) for s, c in labels]
        winner: dict[str, int] = {}
        for i, (sp, m) in enumerate(cands):
            if sp is None:
                continue
            j = winner.get(sp["id"])
            if j is None or RANK[m] < RANK[cands[j][1]]:
                winner[sp["id"]] = i
        return [
            (sp, m) if sp is not None and winner[sp["id"]] == i else (None, "none")
            for i, (sp, m) in enumerate(cands)
        ]

    def match(self, scientific: str, common: str):
        return self.candidate(scientific, common)
