

def test_create_and_get_habit(client) -> None:  # type: ignore[no-untyped-def]
    # create habit
    resp = client.post('/api/habits', json={'name': 'Meditation'})
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['name'] == 'Meditation'
    assert 'id' in data

    # list habits
    resp2 = client.get('/api/habits')
    assert resp2.status_code == 200
    all_habits = resp2.get_json()
    assert any(h['name'] == 'Meditation' for h in all_habits)


def test_update_habit_and_uniqueness(client) -> None:  # type: ignore[no-untyped-def]
    # create two habits
    r1 = client.post('/api/habits', json={'name': 'A', 'icon': 'circle', 'color': '#111111'})
    assert r1.status_code == 201
    _ = r1.get_json()

    r2 = client.post('/api/habits', json={'name': 'B', 'icon': 'square', 'color': '#222222'})
    assert r2.status_code == 201
    h2 = r2.get_json()

    # update habit B -> change name
    up = client.put(f"/api/habits/{h2['id']}", json={'name': 'B-renamed'})
    assert up.status_code == 200
    updated = up.get_json()
    assert updated['name'] == 'B-renamed'

    # attempt to change B to conflict with A's icon+color
    conflict = client.put(f"/api/habits/{h2['id']}", json={'icon': 'circle', 'color': '#111111'})
    assert conflict.status_code == 400
    err = conflict.get_json()
    assert 'icon+color pair must be unique' in err.get('error', '')


def test_delete_habit_and_remove_entries(client) -> None:  # type: ignore[no-untyped-def]
    # create habit
    r = client.post('/api/habits', json={'name': 'ToDelete'})
    assert r.status_code == 201
    h = r.get_json()

    # create an entry for the habit
    e = client.post('/api/entries', json={'habit_id': h['id'], 'date': '2026-07-01', 'done': True})
    assert e.status_code in (200, 201)
    _ = e.get_json()

    # delete habit
    d = client.delete(f"/api/habits/{h['id']}")
    assert d.status_code == 200
    res = d.get_json()
    assert res.get('deleted') is True

    # ensure habit no longer listed
    list_resp = client.get('/api/habits')
    all_habits = list_resp.get_json()
    assert not any(x['id'] == h['id'] for x in all_habits)

    # ensure entries for habit removed
    entries_resp = client.get('/api/entries')
    entries = entries_resp.get_json()
    assert not any(x['habit_id'] == h['id'] for x in entries)
