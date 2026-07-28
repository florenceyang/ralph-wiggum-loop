import uuid
import datetime

from app.models import db, Habit, Entry


def test_create_habit_and_entry(app: object) -> None:
    # create a habit
    h = Habit(id=str(uuid.uuid4()), name="Meditation", icon="Heart", color="#ff0000", order=1)
    db.session.add(h)
    db.session.commit()

    assert Habit.query.count() == 1

    # create an entry
    e = Entry(id=str(uuid.uuid4()), habit_id=h.id, date=datetime.date(2026, 1, 1), done=True, note="Good session")
    db.session.add(e)
    db.session.commit()

    assert Entry.query.filter_by(habit_id=h.id).count() == 1
    fetched = Entry.query.filter_by(habit_id=h.id).first()
    assert fetched.done is True
    assert fetched.note == "Good session"
