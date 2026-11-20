import asyncio
import json
import os
import secrets
import tempfile
import threading
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from matching import Checklist, parse_label

BASE = Path(__file__).parent
MODEL_PATH = Path(os.environ.get(
    "BIRD_MODEL", BASE / "models/birdnet-v3.0-preview3.1-indo-gangetic-fp32-b1.onnx"))
LABELS_PATH = Path(os.environ.get(
    "BIRD_LABELS", BASE / "models/birdnet-v3.0-preview3.1-indo-gangetic-labels-b1.txt"))
SPECIES_PATH = Path(os.environ.get(
    "BIRD_SPECIES", BASE.parent / "birds/data/species.json"))
SITE = "https://pippagg.github.io/family-euro-trip/birds/bird.html?id="

SR = 32000
WIN = 5 * SR
HOP = int(2.5 * SR)
MAX_SECONDS = 60
MAX_BYTES = MAX_SECONDS * SR * 4
LIST_NAME_MAX = 80
LIST_BIRDS_MAX = 460
LIST_BODY_MAX = 20 * 1024

app = FastAPI(title="Bird ID")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pippagg.github.io"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

_lock = threading.Lock()
_lists_lock = threading.Lock()
_state: dict = {}


def load():
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 1
    opts.inter_op_num_threads = 1
    _state["session"] = ort.InferenceSession(
        str(MODEL_PATH), opts, providers=["CPUExecutionProvider"])
    _state["labels"] = [parse_label(l) for l in LABELS_PATH.read_text().splitlines() if l.strip()]
    load_checklist()


def load_checklist():
    cl = Checklist.load(SPECIES_PATH)
    matches = cl.match_all(_state["labels"])
    _state["checklist"] = cl
    _state["matches"] = matches
    _state["unmatched"] = [
        f"{s}_{c}" for (s, c), (m, _) in zip(_state["labels"], matches) if m is None]
    _state["species_by_id"] = {s["id"]: s for s in cl.species}


@app.on_event("startup")
def _startup():
    load()


def windows(audio: np.ndarray):
    n = len(audio)
    starts = list(range(0, max(n - WIN, 0) + 1, HOP))
    if starts[-1] + WIN < n:
        starts.append(starts[-1] + HOP)
    out = []
    for st in starts:
        w = audio[st:st + WIN]
        out.append(np.pad(w, (0, WIN - len(w))) if len(w) < WIN else w)
    return out


def infer(audio: np.ndarray) -> np.ndarray:
    sess = _state["session"]
    best = None
    with _lock:
        for w in windows(audio):
            p = sess.run(["predictions"], {"input": w[None, :].astype(np.float32)})[0][0]
            best = p if best is None else np.maximum(best, p)
    return best


@app.get("/health")
def health():
    labels = _state.get("labels", [])
    return {
        "status": "ok",
        "model_labels": len(labels),
        "checklist_species": len(_state["checklist"].species) if "checklist" in _state else 0,
        "matched_to_checklist": sum(1 for m, _ in _state.get("matches", []) if m),
        "unmatched_labels": _state.get("unmatched", []),
    }


@app.post("/identify")
async def identify(
    request: Request,
    min_conf: float = Query(0.05, ge=0, le=1),
    top_k: int = Query(10, ge=1, le=100),
    local_only: bool = False,
):
    body = await request.body()
    if not body:
        raise HTTPException(400, "empty body")
    if len(body) > MAX_BYTES:
        raise HTTPException(413, f"audio longer than {MAX_SECONDS}s")
    if len(body) % 4:
        raise HTTPException(400, "body must be float32 PCM (length multiple of 4)")
    audio = np.frombuffer(body, dtype="<f4").astype(np.float32)
    if not np.isfinite(audio).all():
        raise HTTPException(400, "non-finite samples")
    scores = await asyncio.get_running_loop().run_in_executor(None, infer, audio)

    results = []
    for i in np.argsort(-scores):
        conf = float(scores[i])
        if conf < min_conf:
            break
        sci, common = _state["labels"][i]
        sp, method = _state["matches"][i]
        if local_only and not sp:
            continue
        photos = (sp or {}).get("photos") or []
        results.append({
            "scientific": sci,
            "common": common,
            "confidence": round(conf, 4),
            "in_checklist": sp is not None,
            "bird_id": sp["id"] if sp else None,
            "bird_url": SITE + sp["id"] if sp else None,
            "checklist_common": sp["common"] if sp else None,
            "photo": photos[0].get("url") if photos else None,
            "match_method": method,
        })
        if len(results) >= top_k:
            break
    return {"duration_s": round(len(audio) / SR, 2), "results": results}


def lists_path() -> Path:
    return Path(os.environ.get("SAVED_LISTS_PATH", BASE / "data/saved_lists.json"))


def read_lists() -> list[dict]:
    p = lists_path()
    return json.loads(p.read_text()) if p.exists() else []


def write_lists(lists: list[dict]):
    p = lists_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=p.parent, prefix=p.name + ".", suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(lists, f)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, p)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


async def _json_body(request: Request) -> dict:
    chunks, total = [], 0
    async for chunk in request.stream():
        total += len(chunk)
        if total > LIST_BODY_MAX:
            raise HTTPException(413, f"body larger than {LIST_BODY_MAX} bytes")
        chunks.append(chunk)
    try:
        data = json.loads(b"".join(chunks))
    except ValueError:
        raise HTTPException(400, "body must be JSON")
    if not isinstance(data, dict):
        raise HTTPException(400, "body must be a JSON object")
    return data


def _validate_new_list(data: dict) -> tuple[str, list[str]]:
    name = data.get("name")
    if not isinstance(name, str) or not (1 <= len(name.strip()) <= LIST_NAME_MAX):
        raise HTTPException(400, f"name must be 1-{LIST_NAME_MAX} characters")
    ids = data.get("bird_ids")
    if (not isinstance(ids, list) or not all(isinstance(b, str) for b in ids)
            or not (1 <= len(ids) <= LIST_BIRDS_MAX)):
        raise HTTPException(400, f"bird_ids must be a list of 1-{LIST_BIRDS_MAX} strings")
    unknown = [b for b in ids if b not in _state["species_by_id"]]
    if unknown:
        raise HTTPException(400, f"unknown bird ids: {', '.join(unknown[:5])}")
    return name.strip(), list(dict.fromkeys(ids))


def _create_list(name: str, bird_ids: list[str]) -> dict:
    entry = {
        "id": secrets.token_urlsafe(8),
        "name": name,
        "bird_ids": bird_ids,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    with _lists_lock:
        lists = read_lists()
        lists.append(entry)
        write_lists(lists)
    return entry


def _expand_bird(bid: str) -> dict | None:
    sp = _state["species_by_id"].get(bid)
    if not sp:
        return None
    photos = sp.get("photos") or []
    return {
        "id": bid,
        "common": sp.get("common"),
        "scientific": sp.get("scientific"),
        "family": sp.get("family"),
        "photo": photos[0].get("url") if photos else None,
        "bird_url": "bird.html?id=" + quote(bid, safe=""),
    }


@app.post("/lists", status_code=201)
async def create_list(request: Request):
    name, bird_ids = _validate_new_list(await _json_body(request))
    entry = await asyncio.get_running_loop().run_in_executor(None, _create_list, name, bird_ids)
    return {k: entry[k] for k in ("id", "name", "bird_ids", "created_at")}


@app.get("/lists")
def get_lists():
    with _lists_lock:
        lists = read_lists()
    return [
        {"id": l["id"], "name": l["name"], "count": len(l["bird_ids"]), "created_at": l["created_at"]}
        for l in reversed(lists)
    ]


@app.get("/lists/{list_id}")
def get_list(list_id: str):
    with _lists_lock:
        lists = read_lists()
    entry = next((l for l in lists if l["id"] == list_id), None)
    if entry is None:
        raise HTTPException(404, "list not found")
    birds = [b for b in (_expand_bird(bid) for bid in entry["bird_ids"]) if b]
    return {"id": entry["id"], "name": entry["name"], "count": len(entry["bird_ids"]),
            "created_at": entry["created_at"], "birds": birds}


@app.delete("/lists/{list_id}", status_code=204)
def delete_list(list_id: str):
    with _lists_lock:
        lists = read_lists()
        kept = [l for l in lists if l["id"] != list_id]
        if len(kept) == len(lists):
            raise HTTPException(404, "list not found")
        write_lists(kept)
    return Response(status_code=204)
