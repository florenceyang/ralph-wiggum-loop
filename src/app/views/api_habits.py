"""API endpoints for habits.

Provides GET /api/habits and POST /api/habits
"""
from flask import Blueprint, jsonify, request

from app.models import db, Habit

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
