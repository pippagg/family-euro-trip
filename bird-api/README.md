# Bird ID API

FastAPI service running BirdNET v3.0 (Indo-Gangetic, fp32 ONNX). `POST /identify?min_conf=0.05&top_k=10&local_only=false`
with raw little-endian float32 mono PCM at 32 kHz (max 60 s). `GET /health` reports label/checklist match counts.
Results are matched to `../birds/data/species.json` (override, scientific, eBird code, synonym, common name; a checklist
species is claimed by only its best-ranked label). `data/ebird_taxonomy.json` is a cached list of
`[scientific, common, ebird_code]` used for eBird-based matching; if missing or invalid, matching falls back to names only.
`.venv/bin/python audit_matching.py` prints match counts by method, collisions, and unmatched checklist species.

Saved bird lists: `POST /lists` `{"name": str (1-80), "bird_ids": [str] (1-460, must exist in species.json)}` → 201;
`GET /lists` (newest first, summaries); `GET /lists/{id}` (birds expanded from species.json); `DELETE /lists/{id}` → 204.
Stored in `data/saved_lists.json` (override with `SAVED_LISTS_PATH`). Bodies over 20 KB get 413.
**Note: lists are public-writable on the tunnel (no auth).**

## Setup
    python3 -m venv .venv && .venv/bin/pip install fastapi uvicorn onnxruntime numpy rapidfuzz pytest httpx
    ./download_model.sh        # model files are gitignored
    .venv/bin/pytest -q

## Run / deploy
    ./run.sh    # uvicorn :8000 + Cloudflare quick tunnel (cloudflared in ~/.local/bin), logs in logs/
The public URL is printed and saved to `logs/tunnel.url`. **Quick tunnel URLs change on every restart**; after
restarting, update `API_URL` in `bird-id/index.html` and `API_BASE` in `birds/config.js`.
species.json is loaded at startup: restart uvicorn after it changes.
