"""API endpoints for habits.

Provides GET /api/habits and POST /api/habits
"""
from flask import Blueprint, jsonify, request

from app.models import db, Habit, Entry

api_habits_bp = Blueprint('api_habits', __name__, url_prefix='/api')

# Simple default palettes
DEFAULT_ICONS = ["circle", "heart", "diamond", "square", "star", "triangle"]
DEFAULT_COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"]


@api_habits_bp.route('/habits', methods=['GET'])
def list_habits():  # type: ignore[no-untyped-def]
    habits = Habit.query.order_by(Habit.order).all()
    result = [
        {
            'id': h.id,
            'name': h.name,
            'icon': h.icon,
            'color': h.color,
            'order': h.order,
        }
        for h in habits
    ]
    return jsonify(result)


@api_habits_bp.route('/habits', methods=['POST'])
def create_habit():  # type: ignore[no-untyped-def]
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'error': 'name is required'}), 400

    icon = data.get('icon')
    color = data.get('color')

    # Assign defaults when not provided
    count = Habit.query.count()
    if not icon:
        icon = DEFAULT_ICONS[count % len(DEFAULT_ICONS)]
    if not color:
        color = DEFAULT_COLORS[count % len(DEFAULT_COLORS)]

    # Enforce uniqueness of (icon, color)
    existing = Habit.query.filter_by(icon=icon, color=color).first()
    if existing:
        return (
            jsonify({'error': 'icon+color pair must be unique', 'conflict_id': existing.id}),
            400,
        )

    habit = Habit(name=name, icon=icon, color=color, order=count)
    db.session.add(habit)
    db.session.commit()

    return (
        jsonify({
            'id': habit.id,
            'name': habit.name,
            'icon': habit.icon,
            'color': habit.color,
            'order': habit.order,
        }),
        201,
    )


@api_habits_bp.route('/habits/<habit_id>', methods=['PUT'])
def update_habit(habit_id):  # type: ignore[no-untyped-def]
    data = request.get_json() or {}
    habit = Habit.query.get(habit_id)
    if not habit:
        return jsonify({'error': 'habit not found'}), 404

    name = data.get('name')
    icon = data.get('icon')
    color = data.get('color')
    order = data.get('order')

    # If both icon and color provided (or either), ensure uniqueness across other habits
    if icon and color:
        existing = (
            Habit.query.filter(Habit.icon == icon, Habit.color == color)
            .filter(Habit.id != habit_id)
            .first()
        )
        if existing:
            return (
                jsonify({'error': 'icon+color pair must be unique', 'conflict_id': existing.id}),
                400,
            )

    if name is not None:
        habit.name = name
    if icon is not None:
        habit.icon = icon
    if color is not None:
        habit.color = color
    if order is not None:
        try:
            habit.order = int(order)
        except Exception:
            return jsonify({'error': 'order must be an integer'}), 400

    db.session.commit()

    return (
        jsonify({
            'id': habit.id,
            'name': habit.name,
            'icon': habit.icon,
            'color': habit.color,
            'order': habit.order,
        }),
        200,
    )


@api_habits_bp.route('/habits/<habit_id>', methods=['DELETE'])
def delete_habit(habit_id):  # type: ignore[no-untyped-def]
    habit = Habit.query.get(habit_id)
    if not habit:
        return jsonify({'error': 'habit not found'}), 404

    # Remove associated entries, then the habit
    try:
        Entry.query.filter_by(habit_id=habit_id).delete()
        db.session.delete(habit)
        db.session.commit()
    except Exception as exc:  # pragma: no cover - error path
        db.session.rollback()
        return jsonify({'error': 'delete failed', 'message': str(exc)}), 500

    return jsonify({'deleted': True}), 200
