"""API endpoints for habits.

Provides GET /api/habits and POST /api/habits
"""
from flask import Blueprint, jsonify, request
import re

from app.models import db, Habit, Entry

api_habits_bp = Blueprint('api_habits', __name__, url_prefix='/api')

# Simple default palettes
DEFAULT_ICONS = ["circle", "heart", "diamond", "square", "star", "triangle"]
DEFAULT_COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"]

# Validation
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
MAX_NAME_LEN = 255
MAX_ICON_LEN = 64


def validate_color(color: str) -> bool:
    return bool(COLOR_RE.match(color))


def validate_icon(icon: str) -> bool:
    return isinstance(icon, str) and 0 < len(icon) <= MAX_ICON_LEN


def validate_name(name: str) -> bool:
    return isinstance(name, str) and 0 < len(name) <= MAX_NAME_LEN


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

    if not validate_name(name):
        return jsonify({'error': f'name must be 1..{MAX_NAME_LEN} characters'}), 400

    icon = data.get('icon')
    color = data.get('color')

    # Assign defaults when not provided
    count = Habit.query.count()
    if not icon:
        icon = DEFAULT_ICONS[count % len(DEFAULT_ICONS)]
    if not color:
        color = DEFAULT_COLORS[count % len(DEFAULT_COLORS)]

    # Validate provided or defaulted values
    if not validate_icon(icon):
        return jsonify({'error': 'icon must be a non-empty string up to 64 chars'}), 400
    if not validate_color(color):
        return jsonify({'error': 'color must be a hex string like #RRGGBB'}), 400

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

    # Prepare candidate values for uniqueness/validation checks
    new_icon = icon if icon is not None else habit.icon
    new_color = color if color is not None else habit.color

    # Validate provided fields
    if name is not None and not validate_name(name):
        return jsonify({'error': f'name must be 1..{MAX_NAME_LEN} characters'}), 400
    if icon is not None and not validate_icon(icon):
        return jsonify({'error': 'icon must be a non-empty string up to 64 chars'}), 400
    if color is not None and not validate_color(color):
        return jsonify({'error': 'color must be a hex string like #RRGGBB'}), 400

    # Ensure uniqueness of resulting (icon, color) across other habits
    existing = (
        Habit.query.filter(Habit.icon == new_icon, Habit.color == new_color)
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
