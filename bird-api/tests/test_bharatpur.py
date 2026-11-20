import json
import os
from pathlib import Path

os.environ["BIRD_SPECIES"] = str(Path(__file__).parent / "stub_species.json")

import pytest
from fastapi.testclient import TestClient

import app as appmod


@pytest.fixture(scope="module")
def client():
    with TestClient(appmod.app) as c:
        yield c


@pytest.fixture
def store(tmp_path, monkeypatch):
    path = tmp_path / "saved_lists.json"
    monkeypatch.setenv("SAVED_LISTS_PATH", str(path))
    return path


@pytest.fixture
def ids():
    return list(appmod._state["species_by_id"])[:2]


def test_created_on_first_use_and_hidden_from_lists(client, store, ids):
    assert not store.exists()
    j = client.get("/bharatpur").json()
    assert j["id"] == "bharatpur" and j["name"] == "Bharatpur birds"
    assert j["count"] == 0 and j["birds"] == []
    assert [e["id"] for e in json.loads(store.read_text())] == ["bharatpur"]
    assert client.get("/lists").json() == []

    client.post("/lists", json={"name": "other", "bird_ids": ids})
    assert [l["name"] for l in client.get("/lists").json()] == ["other"]
    assert client.get("/bharatpur").json()["count"] == 0


def test_add_remove_and_idempotency(client, store, ids):
    r = client.post("/bharatpur/birds", json={"bird_id": ids[0]})
    assert r.status_code == 200
    assert [b["id"] for b in r.json()["birds"]] == [ids[0]]
    assert r.json()["birds"][0]["bird_url"] == "bird.html?id=" + ids[0]

    again = client.post("/bharatpur/birds", json={"bird_id": ids[0]}).json()
    assert again["count"] == 1

    client.post("/bharatpur/birds", json={"bird_id": ids[1]})
    assert [b["id"] for b in client.get("/bharatpur").json()["birds"]] == ids

    r = client.delete(f"/bharatpur/birds/{ids[0]}")
    assert r.status_code == 200 and [b["id"] for b in r.json()["birds"]] == [ids[1]]
    assert client.delete(f"/bharatpur/birds/{ids[0]}").json()["count"] == 1
    assert client.get("/bharatpur").json()["count"] == 1


def test_invalid_bird_ids(client, store, ids):
    assert client.post("/bharatpur/birds", json={"bird_id": "no-such-bird"}).status_code == 400
    assert client.post("/bharatpur/birds", json={"bird_id": 5}).status_code == 400
    assert client.post("/bharatpur/birds", json={}).status_code == 400
    assert client.post("/bharatpur/birds", content=b"nope").status_code == 400
    assert client.delete("/bharatpur/birds/no-such-bird").status_code == 404
    assert client.get("/bharatpur").json()["count"] == 0
