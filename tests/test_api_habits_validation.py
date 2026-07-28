

def test_create_habit_invalid_color(client) -> None:  # type: ignore[no-untyped-def]
    # invalid color format
    resp = client.post('/api/habits', json={'name': 'InvalidColor', 'color': 'red'})
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'color' in data.get('error', '') or 'hex' in data.get('error', '')


def test_update_habit_invalid_color(client) -> None:  # type: ignore[no-untyped-def]
    # create valid habit
    r = client.post('/api/habits', json={'name': 'Valid', 'icon': 'star', 'color': '#123456'})
    assert r.status_code == 201
    h = r.get_json()

    # attempt to update with invalid color
    up = client.put(f"/api/habits/{h['id']}", json={'color': 'blue'})
    assert up.status_code == 400
    err = up.get_json()
    assert 'color' in err.get('error', '') or 'hex' in err.get('error', '')


def test_create_habit_name_too_long(client) -> None:  # type: ignore[no-untyped-def]
    long_name = 'x' * 300
    resp = client.post('/api/habits', json={'name': long_name})
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'name' in data.get('error', '')
