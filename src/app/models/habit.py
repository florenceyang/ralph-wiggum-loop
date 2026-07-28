"""Habit model.

Defines the Habit SQLAlchemy model used to store habit metadata.
"""
from datetime import datetime
import uuid

from .base import db


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Habit(db.Model):  # type: ignore
    __tablename__ = 'habits'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(64), nullable=False)
    color = db.Column(db.String(7), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)

    def __repr__(self) -> str:  # pragma: no cover - trivial
        return f"<Habit id={self.id} name={self.name} icon={self.icon} color={self.color}>"
