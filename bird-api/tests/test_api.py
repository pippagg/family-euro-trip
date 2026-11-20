import os
from pathlib import Path

os.environ["BIRD_SPECIES"] = str(Path(__file__).parent / "stub_species.json")

import numpy as np
import pytest
from fastapi.testclient import TestClient

import app as appmod
from matching import Checklist



@pytest.fixture(scope="module")
def client():
    with TestClient(appmod.app) as c:
        yield c


def pcm(a):
    return np.asarray(a, dtype="<f4").tobytes()


def test_health(client):
    h = client.get("/health").json()
    assert h["model_labels"] == 814 and h["checklist_species"] == 3
    assert h["matched_to_checklist"] >= 2


def test_silence_and_sine(client):
    r = client.post("/identify?min_conf=0&top_k=3", content=pcm(np.zeros(32000 * 3)))
    assert r.status_code == 200
    j = r.json()
    assert j["duration_s"] == 3.0 and len(j["results"]) == 3
    t = np.arange(32000 * 8) / 32000
    r = client.post("/identify", content=pcm(0.3 * np.sin(2 * np.pi * 3000 * t)))
    assert r.status_code == 200 and r.json()["duration_s"] == 8.0


def test_errors(client):
    assert client.post("/identify", content=b"").status_code == 400
    assert client.post("/identify", content=b"abcde").status_code == 400
    assert client.post("/identify", content=b"\0" * (32000 * 4 * 61)).status_code == 413


def test_windows():
    assert len(appmod.windows(np.zeros(100))) == 1
    assert len(appmod.windows(np.zeros(160000))) == 1
    assert len(appmod.windows(np.zeros(320000))) == 3
    assert len(appmod.windows(np.zeros(170000))) == 2
    assert all(len(w) == 160000 for w in appmod.windows(np.zeros(250000)))


def test_cors(client):
    r = client.options("/identify", headers={"Origin": "https://pippagg.github.io",
                                              "Access-Control-Request-Method": "POST"})
    assert r.headers["access-control-allow-origin"] == "https://pippagg.github.io"


def test_matching():
    cl = Checklist.load(Path(__file__).parent / "stub_species.json")
    assert cl.match("Anas querquedula", "Garganey")[1] in ("synonym", "ebird")
    assert cl.match("Corvus splendens", "House Crow")[1] == "scientific"
    assert cl.match("Anas strepera", "Gadwall")[0]["id"] == "gadwall"
    assert cl.match("Foo bar", "House  Crow")[1] == "ebird"
    assert cl.match("Spatula qwerty", "Garganey")[0]["id"] == "garganey"
    assert cl.match("Zzz zzz", "Totally Other")[0] is None


def test_no_loose_epithet_and_collisions():
    sp = [{"id": "bng", "common": "Black-necked Grebe", "scientific": "Podiceps nigricollis", "ebird_code": "bnegre"},
          {"id": "gar", "common": "Garganey", "scientific": "Spatula querquedula", "ebird_code": "gargan"}]
    cl = Checklist(sp)
    assert cl.match("Grus nigricollis", "Black-necked Crane")[0] is None
    out = cl.match_all([("Anas querquedula", "Garganey (syn)"), ("Spatula querquedula", "Garganey")])
    assert out[0][0] is None and out[1][1] == "scientific"


def test_real_checklist_overrides():
    cl = Checklist.load(Path(__file__).parents[2] / "birds/data/species.json")
    if not cl.species:
        pytest.skip("no species.json")
    sp, m = cl.candidate("Pycnonotus leucogenys", "Himalayan Bulbul")
    assert sp["id"] == "himalayan-bulbul"
    assert cl.candidate("Prinia atrogularis", "Black-throated Prinia")[0] is None
