

def test_bulk_create_and_update_entries(client) -> None:  # type: ignore[no-untyped-def]
    # create habit
    resp = client.post('/api/habits', json={'name': 'Exercise'})
    assert resp.status_code == 201
    habit = resp.get_json()

    # bulk create two entries
    bulk = {
        'entries': [
            {'habit_id': habit['id'], 'date': '2026-07-05', 'done': True},
            {'habit_id': habit['id'], 'date': '2026-07-06', 'done': False},
        ]
    }
    resp2 = client.post('/api/entries/bulk', json=bulk)
    assert resp2.status_code == 200
    result = resp2.get_json()
    assert 'updated' in result
    assert len(result['updated']) == 2

    # ensure entries are returned by month query
    resp3 = client.get('/api/entries?month=2026-07')
    assert resp3.status_code == 200
    entries = resp3.get_json()
    dates = {e['date']: e for e in entries}
    assert '2026-07-05' in dates and '2026-07-06' in dates
    assert dates['2026-07-05']['done'] is True
    assert dates['2026-07-06']['done'] is False

    # bulk update: toggle the second entry to done
    bulk2 = {
        'entries': [
            {'habit_id': habit['id'], 'date': '2026-07-06', 'done': True},
        ]
    }
    resp4 = client.post('/api/entries/bulk', json=bulk2)
    assert resp4.status_code == 200

    # verify update
    resp5 = client.get('/api/entries?month=2026-07')
    entries2 = resp5.get_json()
    dates2 = {e['date']: e for e in entries2}
    assert dates2['2026-07-06']['done'] is True
