"""API endpoints for entries.

Provides GET /api/entries and POST /api/entries
"""
from flask import Blueprint, jsonify, request
from datetime import datetime, date
import calendar

from app.models import db, Entry, Habit

api_entries_bp = Blueprint('api_entries', __name__, url_prefix='/api')


def month_date_range(month_str: str) -> tuple[date, date]:
    # month_str expected as YYYY-MM
    year, mon = (int(x) for x in month_str.split('-'))
    first = date(year, mon, 1)
    last_day = calendar.monthrange(year, mon)[1]
    last = date(year, mon, last_day)
    return first, last


@api_entries_bp.route('/entries', methods=['GET'])
def list_entries():  # type: ignore[no-untyped-def]
    month = request.args.get('month')
    if month:
        try:
            first, last = month_date_range(month)
        except Exception:
            return jsonify({'error': 'invalid month format, expected YYYY-MM'}), 400
        entries = Entry.query.filter(Entry.date >= first, Entry.date <= last).all()
    else:
        entries = Entry.query.all()

    result = [
        {
            'id': e.id,
            'habit_id': e.habit_id,
            'date': e.date.isoformat(),
            'done': e.done,
            'note': e.note,
        }
        for e in entries
    ]
    return jsonify(result)


@api_entries_bp.route('/entries', methods=['POST'])
def create_or_update_entry():  # type: ignore[no-untyped-def]
    data = request.get_json() or {}
    habit_id = data.get('habit_id')
    date_str = data.get('date')
    done = data.get('done', True)
    note = data.get('note')

    if not habit_id or not date_str:
        return jsonify({'error': 'habit_id and date are required'}), 400

    # validate habit exists
    habit = Habit.query.get(habit_id)
    if not habit:
        return jsonify({'error': 'habit not found'}), 404

    try:
        d = datetime.strptime(date_str, '%Y-%m-%d').date()
    except Exception:
        return jsonify({'error': 'date must be YYYY-MM-DD'}), 400

    entry = Entry.query.filter_by(habit_id=habit_id, date=d).first()
    if entry:
        entry.done = bool(done)
        entry.note = note
    else:
        entry = Entry(habit_id=habit_id, date=d, done=bool(done), note=note)
        db.session.add(entry)

    db.session.commit()

    return (
        jsonify(
            {
                'id': entry.id,
                'habit_id': entry.habit_id,
                'date': entry.date.isoformat(),
                'done': entry.done,
                'note': entry.note,
            }
        ),
        200,
    )
