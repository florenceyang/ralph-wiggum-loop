

def test_create_entry_and_get_by_month(client) -> None:  # type: ignore[no-untyped-def]
    # create habit first
    resp = client.post('/api/habits', json={'name': 'Reading'})
    assert resp.status_code == 201
    habit = resp.get_json()

    # create entry
    resp2 = client.post('/api/entries', json={
        'habit_id': habit['id'],
        'date': '2026-07-10',
        'done': True,
    })
    assert resp2.status_code in (200, 201)
    entry = resp2.get_json()
    assert entry['habit_id'] == habit['id']
    assert entry['date'] == '2026-07-10'

    # query by month
    resp3 = client.get('/api/entries?month=2026-07')
    assert resp3.status_code == 200
    entries = resp3.get_json()
    assert any(e['date'] == '2026-07-10' and e['habit_id'] == habit['id'] for e in entries)
