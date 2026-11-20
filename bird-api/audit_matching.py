"""Audit how model labels map onto the Bharatpur checklist.

Usage: .venv/bin/python audit_matching.py
"""
from collections import Counter, defaultdict
from pathlib import Path

from matching import Checklist, parse_label

BASE = Path(__file__).parent
LABELS = BASE / "models/birdnet-v3.0-preview3.1-indo-gangetic-labels-b1.txt"
SPECIES = BASE.parent / "birds/data/species.json"


def main():
    cl = Checklist.load(SPECIES)
    labels = [parse_label(l) for l in LABELS.read_text().splitlines() if l.strip()]
    matches = cl.match_all(labels)

    print(f"labels: {len(labels)}  checklist species: {len(cl.species)}")

    by_method = Counter(m for sp, m in matches if sp is not None)
    print("\nmatched by method:")
    for m, n in by_method.most_common():
        print(f"  {m:<10} {n}")
    print(f"  total matched: {sum(by_method.values())}")

    print("\nnon-scientific matches (label -> checklist, method):")
    for (sci, com), (sp, m) in zip(labels, matches):
        if sp is not None and m != "scientific":
            print(f"  {sci}_{com} -> {sp['id']} ({sp['scientific']}) [{m}]")

    # Labels that would have matched a species but lost to a better label.
    candidates = [cl.candidate(s, c) for s, c in labels]
    losers = defaultdict(list)
    for (sci, com), (sp, m), (wsp, _) in zip(labels, candidates, matches):
        if sp is not None and (wsp is None or wsp["id"] != sp["id"]):
            losers[sp["id"]].append(f"{sci}_{com} [{m}]")
    print(f"\ncollisions (checklist species claimed by several labels): {len(losers)}")
    for sid, ls in sorted(losers.items()):
        winner = next((f"{s}_{c}" for (s, c), (sp, _) in zip(labels, matches)
                       if sp is not None and sp["id"] == sid), None)
        print(f"  {sid}: kept {winner}; dropped {', '.join(ls)}")

    matched_ids = {sp["id"] for sp, _ in matches if sp is not None}
    missing = [s for s in cl.species if s["id"] not in matched_ids]
    print(f"\nchecklist species without a label: {len(missing)}")
    for s in missing:
        print(f"  {s['id']}: {s['scientific']} ({s['common']}) [{s.get('ebird_code')}]")


if __name__ == "__main__":
    main()
