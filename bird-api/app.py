import asyncio
import os
import threading
from pathlib import Path

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, HTTPException, Query, Request
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

app = FastAPI(title="Bird ID")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pippagg.github.io"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

_lock = threading.Lock()
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
