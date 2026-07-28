"""Habits view (route).

Serves the habits page — a placeholder island mount point that the frontend will
hydrate with the Habit Tracker UI. Keeps server-side simple: only renders the
HTML shell for the client-side app.
"""
from flask import Blueprint, render_template

habits_bp = Blueprint('habits', __name__)


@habits_bp.route('/habits')
def index():  # type: ignore[no-untyped-def]
    """Render the Habits page.

    The template contains a ``[data-island="habits"]`` mount point that the
    frontend will hydrate with the habit-tracker UI.
    """
    return render_template('habits.html')
