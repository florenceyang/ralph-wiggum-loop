"""Entry model.

Defines the Entry SQLAlchemy model used to store per-day habit marks.
"""
from datetime import datetime
import uuid

from .base import db


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Entry(db.Model):  # type: ignore
    __tablename__ = 'entries'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    habit_id = db.Column(db.String(36), db.ForeignKey('habits.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    done = db.Column(db.Boolean, nullable=False, default=False)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index('ix_entries_habit_date', 'habit_id', 'date'),
    )

    def __repr__(self) -> str:  # pragma: no cover - trivial
        return f"<Entry id={self.id} habit_id={self.habit_id} date={self.date} done={self.done}>"
