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
    habit = db.session.get(Habit, habit_id)
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


@api_entries_bp.route('/entries/bulk', methods=['POST'])
def bulk_entries():  # type: ignore[no-untyped-def]
    data = request.get_json() or {}
    items = data.get('entries')
    if not items or not isinstance(items, list):
        return jsonify({'error': 'entries list required'}), 400

    results = []
    try:
        # Use a transaction for bulk operations
        # Use nested transaction to work with Flask-SQLAlchemy's session scoping
        with db.session.begin_nested():
            for it in items:
                habit_id = it.get('habit_id')
                date_str = it.get('date')
                done = it.get('done', True)
                note = it.get('note')

                if not habit_id or not date_str:
                    raise ValueError('habit_id and date are required for each entry')

                habit = db.session.get(Habit, habit_id)
                if not habit:
                    # Abort early with a 404 for missing habit
                    return jsonify({'error': 'habit not found', 'habit_id': habit_id}), 404

                try:
                    d = datetime.strptime(date_str, '%Y-%m-%d').date()
                except Exception:
                    return jsonify({'error': 'date must be YYYY-MM-DD', 'date': date_str}), 400

                entry = Entry.query.filter_by(habit_id=habit_id, date=d).first()
                if entry:
                    entry.done = bool(done)
                    entry.note = note
                else:
                    entry = Entry(habit_id=habit_id, date=d, done=bool(done), note=note)
                    db.session.add(entry)

                results.append({
                    'id': entry.id,
                    'habit_id': entry.habit_id,
                    'date': entry.date.isoformat(),
                    'done': entry.done,
                    'note': entry.note,
                })
    except Exception as exc:  # pragma: no cover - error path
        # Rollback handled by contextmanager; return error
        return jsonify({'error': 'bulk update failed', 'message': str(exc)}), 500

    return jsonify({'updated': results}), 200


@api_entries_bp.route('/entries/<entry_id>', methods=['DELETE'])
def delete_entry(entry_id):  # type: ignore[no-untyped-def]
    """Delete a single entry by ID."""
    entry = db.session.get(Entry, entry_id)
    if not entry:
        return jsonify({'error': 'entry not found'}), 404

    try:
        db.session.delete(entry)
        db.session.commit()
    except Exception as exc:  # pragma: no cover - error path
        db.session.rollback()
        return jsonify({'error': 'delete failed', 'message': str(exc)}), 500

    return jsonify({'deleted': True}), 200


@api_entries_bp.route('/entries/<entry_id>', methods=['PATCH'])
def patch_entry(entry_id):  # type: ignore[no-untyped-def]
    """Partial update for an entry (supports done and note)."""
    data = request.get_json() or {}
    entry = db.session.get(Entry, entry_id)
    if not entry:
        return jsonify({'error': 'entry not found'}), 404

    if 'done' in data:
        entry.done = bool(data.get('done'))
    if 'note' in data:
        entry.note = data.get('note')

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
