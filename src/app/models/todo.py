"""Todo models.

Defines the TodoGroup and TodoItem SQLAlchemy models used to store the
to-do list feature described in specs/habit-tracker-v3-specifications.md
section 3 (categories of tasks, and the tasks themselves, with drag-and-drop
ordering support).
"""
from datetime import datetime
import uuid

from .base import db


def generate_uuid() -> str:
    return str(uuid.uuid4())


class TodoGroup(db.Model):  # type: ignore
    __tablename__ = 'todo_groups'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    color = db.Column(db.String(7), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)

    items = db.relationship(
        'TodoItem',
        backref='group',
        order_by='TodoItem.order',
        cascade='all, delete-orphan',
    )

    def __repr__(self) -> str:  # pragma: no cover - trivial
        return f"<TodoGroup id={self.id} name={self.name}>"


class TodoItem(db.Model):  # type: ignore
    __tablename__ = 'todo_items'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    group_id = db.Column(db.String(36), db.ForeignKey('todo_groups.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index('ix_todo_items_group_order', 'group_id', 'order'),
    )

    def __repr__(self) -> str:  # pragma: no cover - trivial
        return f"<TodoItem id={self.id} group_id={self.group_id} text={self.text!r}>"
