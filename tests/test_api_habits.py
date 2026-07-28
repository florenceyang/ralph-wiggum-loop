

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
