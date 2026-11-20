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


def test_create_get_delete(client, store, ids):
    r = client.post("/lists", json={"name": "  Morning walk ", "bird_ids": ids + [ids[0]]})
    assert r.status_code == 201
    created = r.json()
    assert created["name"] == "Morning walk" and created["bird_ids"] == ids
    assert set(created) == {"id", "name", "bird_ids", "created_at"}
    assert store.exists()

    listed = client.get("/lists").json()
    assert [(l["id"], l["count"]) for l in listed] == [(created["id"], 2)]

    full = client.get(f"/lists/{created['id']}").json()
    assert [b["id"] for b in full["birds"]] == ids
    assert full["birds"][0]["bird_url"] == "bird.html?id=" + ids[0]
    assert {"common", "scientific", "family", "photo"} <= set(full["birds"][0])

    assert client.delete(f"/lists/{created['id']}").status_code == 204
    assert client.get("/lists").json() == []
    assert client.get(f"/lists/{created['id']}").status_code == 404
    assert client.delete(f"/lists/{created['id']}").status_code == 404


def test_lists_newest_first(client, store, ids):
    first = client.post("/lists", json={"name": "a", "bird_ids": ids[:1]}).json()
    second = client.post("/lists", json={"name": "b", "bird_ids": ids}).json()
    assert [l["id"] for l in client.get("/lists").json()] == [second["id"], first["id"]]


def test_invalid_input_is_400(client, store, ids):
    bad = [
        {"name": "x", "bird_ids": ["no-such-bird"]},
        {"name": "x", "bird_ids": ids + ["no-such-bird"]},
        {"name": "x", "bird_ids": []},
        {"name": "x", "bird_ids": [1]},
        {"name": "   ", "bird_ids": ids},
        {"name": "y" * 81, "bird_ids": ids},
        {"bird_ids": ids},
    ]
    for body in bad:
        assert client.post("/lists", json=body).status_code == 400, body
    assert client.post("/lists", content=b"not json").status_code == 400
    assert client.post("/lists", content=b"[]").status_code == 400
    assert not store.exists()


def test_oversized_body_is_413(client, store, ids):
    body = {"name": "x", "bird_ids": ids, "pad": "p" * (20 * 1024)}
    assert client.post("/lists", json=body).status_code == 413
    assert not store.exists()
