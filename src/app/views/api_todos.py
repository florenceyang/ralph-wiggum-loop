"""API endpoints for the To-Do list feature.

Provides CRUD for TodoGroup/TodoItem plus a dedicated reorder endpoint used
by the drag-and-drop frontend (see specs/habit-tracker-v3-specifications.md
section 3.1).
"""
from flask import Blueprint, jsonify, request

from app.models import db, TodoGroup, TodoItem

api_todos_bp = Blueprint('api_todos', __name__, url_prefix='/api')

MAX_NAME_LEN = 255
DEFAULT_COLOR = '#64748b'


def validate_color(color: str) -> bool:
    import re
    return bool(re.match(r'^#[0-9a-fA-F]{6}$', color or ''))


def group_to_dict(group: TodoGroup) -> "dict[str, object]":
    return {
        'id': group.id,
        'name': group.name,
        'color': group.color,
        'order': group.order,
        'items': [item_to_dict(i) for i in sorted(group.items, key=lambda i: i.order)],
    }


def item_to_dict(item: TodoItem) -> "dict[str, object]":
    return {
        'id': item.id,
        'group_id': item.group_id,
        'text': item.text,
        'completed': item.completed,
        'order': item.order,
    }


@api_todos_bp.route('/todos', methods=['GET'])
def list_todos():  # type: ignore[no-untyped-def]
    groups = TodoGroup.query.order_by(TodoGroup.order).all()
    return jsonify([group_to_dict(g) for g in groups])


@api_todos_bp.route('/todos/groups', methods=['POST'])
def create_group():  # type: ignore[no-untyped-def]
    data = request.get_json() or {}
    name = data.get('name')
    if not isinstance(name, str) or not (0 < len(name) <= MAX_NAME_LEN):
        return jsonify({'error': f'name must be 1..{MAX_NAME_LEN} characters'}), 400

    color = data.get('color') or DEFAULT_COLOR
    if not validate_color(color):
        return jsonify({'error': 'color must be a hex string like #RRGGBB'}), 400

    count = TodoGroup.query.count()
    group = TodoGroup(name=name, color=color, order=count)
    db.session.add(group)
    db.session.commit()
    return jsonify(group_to_dict(group)), 201


@api_todos_bp.route('/todos/groups/<group_id>', methods=['PUT'])
def update_group(group_id):  # type: ignore[no-untyped-def]
    group = db.session.get(TodoGroup, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404

    data = request.get_json() or {}
    name = data.get('name')
    color = data.get('color')
    order = data.get('order')

    if name is not None:
        if not isinstance(name, str) or not (0 < len(name) <= MAX_NAME_LEN):
            return jsonify({'error': f'name must be 1..{MAX_NAME_LEN} characters'}), 400
        group.name = name
    if color is not None:
        if not validate_color(color):
            return jsonify({'error': 'color must be a hex string like #RRGGBB'}), 400
        group.color = color
    if order is not None:
        try:
            group.order = int(order)
        except (TypeError, ValueError):
            return jsonify({'error': 'order must be an integer'}), 400

    db.session.commit()
    return jsonify(group_to_dict(group)), 200


@api_todos_bp.route('/todos/groups/<group_id>', methods=['DELETE'])
def delete_group(group_id):  # type: ignore[no-untyped-def]
    group = db.session.get(TodoGroup, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404

    try:
        db.session.delete(group)
        db.session.commit()
    except Exception as exc:  # pragma: no cover - error path
        db.session.rollback()
        return jsonify({'error': 'delete failed', 'message': str(exc)}), 500

    return jsonify({'deleted': True}), 200


@api_todos_bp.route('/todos/items', methods=['POST'])
def create_item():  # type: ignore[no-untyped-def]
    data = request.get_json() or {}
    group_id = data.get('group_id')
    text = data.get('text')

    if not group_id:
        return jsonify({'error': 'group_id is required'}), 400
    if not isinstance(text, str) or len(text) == 0:
        return jsonify({'error': 'text is required'}), 400

    group = db.session.get(TodoGroup, group_id)
    if not group:
        return jsonify({'error': 'group not found'}), 404

    count = TodoItem.query.filter_by(group_id=group_id).count()
    item = TodoItem(group_id=group_id, text=text, completed=bool(data.get('completed', False)), order=count)
    db.session.add(item)
    db.session.commit()
    return jsonify(item_to_dict(item)), 201


@api_todos_bp.route('/todos/items/<item_id>', methods=['PUT'])
def update_item(item_id):  # type: ignore[no-untyped-def]
    item = db.session.get(TodoItem, item_id)
    if not item:
        return jsonify({'error': 'item not found'}), 404

    data = request.get_json() or {}
    text = data.get('text')
    completed = data.get('completed')
    group_id = data.get('group_id')
    order = data.get('order')

    if text is not None:
        if not isinstance(text, str) or len(text) == 0:
            return jsonify({'error': 'text must be a non-empty string'}), 400
        item.text = text
    if completed is not None:
        item.completed = bool(completed)
    if group_id is not None:
        new_group = db.session.get(TodoGroup, group_id)
        if not new_group:
            return jsonify({'error': 'group not found'}), 404
        item.group_id = group_id
    if order is not None:
        try:
            item.order = int(order)
        except (TypeError, ValueError):
            return jsonify({'error': 'order must be an integer'}), 400

    db.session.commit()
    return jsonify(item_to_dict(item)), 200


@api_todos_bp.route('/todos/items/<item_id>', methods=['DELETE'])
def delete_item(item_id):  # type: ignore[no-untyped-def]
    item = db.session.get(TodoItem, item_id)
    if not item:
        return jsonify({'error': 'item not found'}), 404

    try:
        db.session.delete(item)
        db.session.commit()
    except Exception as exc:  # pragma: no cover - error path
        db.session.rollback()
        return jsonify({'error': 'delete failed', 'message': str(exc)}), 500

    return jsonify({'deleted': True}), 200


@api_todos_bp.route('/todos/reorder', methods=['PUT'])
def reorder_items():  # type: ignore[no-untyped-def]
    """Persist drag-and-drop order (and optionally group moves) in bulk.

    Body: {"items": [{"id": ..., "group_id": ..., "order": ...}, ...]}
    `group_id` is optional per entry; omit it to keep the item's current
    group while only updating its order.
    """
    data = request.get_json() or {}
    items = data.get('items')
    if not isinstance(items, list) or not items:
        return jsonify({'error': 'items list required'}), 400

    updated = []
    try:
        with db.session.begin_nested():
            for entry in items:
                item_id = entry.get('id')
                order = entry.get('order')
                group_id = entry.get('group_id')

                if not item_id or order is None:
                    raise ValueError('id and order are required for each item')

                item = db.session.get(TodoItem, item_id)
                if not item:
                    return jsonify({'error': 'item not found', 'id': item_id}), 404

                if group_id is not None:
                    new_group = db.session.get(TodoGroup, group_id)
                    if not new_group:
                        return jsonify({'error': 'group not found', 'group_id': group_id}), 404
                    item.group_id = group_id

                try:
                    item.order = int(order)
                except (TypeError, ValueError):
                    return jsonify({'error': 'order must be an integer', 'id': item_id}), 400

                updated.append(item_to_dict(item))
    except ValueError as exc:
        db.session.rollback()
        return jsonify({'error': str(exc)}), 400
    except Exception as exc:  # pragma: no cover - error path
        db.session.rollback()
        return jsonify({'error': 'reorder failed', 'message': str(exc)}), 500

    db.session.commit()
    return jsonify({'updated': updated}), 200
