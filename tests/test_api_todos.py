"""Tests for the To-Do list API (spec v3 section 3.1)."""


def test_create_group_and_list(client) -> None:  # type: ignore[no-untyped-def]
    resp = client.post('/api/todos/groups', json={'name': 'Work', 'color': '#ff0000'})
    assert resp.status_code == 201
    group = resp.get_json()
    assert group['name'] == 'Work'
    assert group['color'] == '#ff0000'
    assert group['items'] == []

    listing = client.get('/api/todos')
    assert listing.status_code == 200
    groups = listing.get_json()
    assert any(g['id'] == group['id'] for g in groups)


def test_create_group_defaults_color_and_validates_name(client) -> None:  # type: ignore[no-untyped-def]
    resp = client.post('/api/todos/groups', json={'name': 'Personal'})
    assert resp.status_code == 201
    assert resp.get_json()['color'].startswith('#')

    bad = client.post('/api/todos/groups', json={'name': ''})
    assert bad.status_code == 400

    bad_color = client.post('/api/todos/groups', json={'name': 'X', 'color': 'notacolor'})
    assert bad_color.status_code == 400


def test_update_and_delete_group(client) -> None:  # type: ignore[no-untyped-def]
    group = client.post('/api/todos/groups', json={'name': 'Errands'}).get_json()

    updated = client.put(f"/api/todos/groups/{group['id']}", json={'name': 'Errands 2', 'order': 3})
    assert updated.status_code == 200
    body = updated.get_json()
    assert body['name'] == 'Errands 2'
    assert body['order'] == 3

    deleted = client.delete(f"/api/todos/groups/{group['id']}")
    assert deleted.status_code == 200
    assert deleted.get_json()['deleted'] is True

    missing = client.put(f"/api/todos/groups/{group['id']}", json={'name': 'x'})
    assert missing.status_code == 404


def test_create_item_requires_existing_group(client) -> None:  # type: ignore[no-untyped-def]
    resp = client.post('/api/todos/items', json={'group_id': 'nope', 'text': 'Buy milk'})
    assert resp.status_code == 404

    resp_no_text = client.post('/api/todos/items', json={'group_id': 'nope'})
    assert resp_no_text.status_code == 400


def test_item_crud_and_group_deletion_cascades(client) -> None:  # type: ignore[no-untyped-def]
    group = client.post('/api/todos/groups', json={'name': 'Chores'}).get_json()

    item = client.post('/api/todos/items', json={'group_id': group['id'], 'text': 'Wash dishes'})
    assert item.status_code == 201
    item_body = item.get_json()
    assert item_body['completed'] is False
    assert item_body['order'] == 0

    toggled = client.put(f"/api/todos/items/{item_body['id']}", json={'completed': True})
    assert toggled.status_code == 200
    assert toggled.get_json()['completed'] is True

    renamed = client.put(f"/api/todos/items/{item_body['id']}", json={'text': 'Wash all dishes'})
    assert renamed.get_json()['text'] == 'Wash all dishes'

    # deleting the group removes its items too
    client.delete(f"/api/todos/groups/{group['id']}")
    missing = client.put(f"/api/todos/items/{item_body['id']}", json={'text': 'x'})
    assert missing.status_code == 404


def test_move_item_across_groups(client) -> None:  # type: ignore[no-untyped-def]
    g1 = client.post('/api/todos/groups', json={'name': 'G1'}).get_json()
    g2 = client.post('/api/todos/groups', json={'name': 'G2'}).get_json()
    item = client.post('/api/todos/items', json={'group_id': g1['id'], 'text': 'Move me'}).get_json()

    moved = client.put(f"/api/todos/items/{item['id']}", json={'group_id': g2['id'], 'order': 0})
    assert moved.status_code == 200
    assert moved.get_json()['group_id'] == g2['id']

    bad_group = client.put(f"/api/todos/items/{item['id']}", json={'group_id': 'missing'})
    assert bad_group.status_code == 404


def test_delete_item(client) -> None:  # type: ignore[no-untyped-def]
    group = client.post('/api/todos/groups', json={'name': 'G'}).get_json()
    item = client.post('/api/todos/items', json={'group_id': group['id'], 'text': 'Delete me'}).get_json()

    deleted = client.delete(f"/api/todos/items/{item['id']}")
    assert deleted.status_code == 200
    assert deleted.get_json()['deleted'] is True

    missing = client.delete(f"/api/todos/items/{item['id']}")
    assert missing.status_code == 404


def test_reorder_persists_order_and_group(client) -> None:  # type: ignore[no-untyped-def]
    g1 = client.post('/api/todos/groups', json={'name': 'G1'}).get_json()
    g2 = client.post('/api/todos/groups', json={'name': 'G2'}).get_json()
    a = client.post('/api/todos/items', json={'group_id': g1['id'], 'text': 'A'}).get_json()
    b = client.post('/api/todos/items', json={'group_id': g1['id'], 'text': 'B'}).get_json()

    resp = client.put('/api/todos/reorder', json={'items': [
        {'id': b['id'], 'order': 0},
        {'id': a['id'], 'order': 1, 'group_id': g2['id']},
    ]})
    assert resp.status_code == 200
    updated = {u['id']: u for u in resp.get_json()['updated']}
    assert updated[b['id']]['order'] == 0
    assert updated[a['id']]['group_id'] == g2['id']
    assert updated[a['id']]['order'] == 1

    listing = client.get('/api/todos').get_json()
    g2_after = next(g for g in listing if g['id'] == g2['id'])
    assert any(i['id'] == a['id'] for i in g2_after['items'])


def test_reorder_validation_errors(client) -> None:  # type: ignore[no-untyped-def]
    empty = client.put('/api/todos/reorder', json={'items': []})
    assert empty.status_code == 400

    missing_fields = client.put('/api/todos/reorder', json={'items': [{'id': 'x'}]})
    assert missing_fields.status_code == 400

    unknown_item = client.put('/api/todos/reorder', json={'items': [{'id': 'nope', 'order': 0}]})
    assert unknown_item.status_code == 404
