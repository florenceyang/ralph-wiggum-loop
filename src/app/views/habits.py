"""Habits view (route).

Serves the habits page, which mounts the full React habit-tracker UI
(HabitApp: editable table + calendar + legend + editor) via the
``[data-island="habits"]`` island. Also owns the root ``/`` redirect,
since the habit tracker replaced the former Space Invaders homepage.
"""
from flask import Blueprint, redirect, render_template

habits_bp = Blueprint('habits', __name__)


@habits_bp.route('/')
def root():  # type: ignore[no-untyped-def]
    """Redirect root to the Habits page per specification (replaces Hello World/game)."""
    return redirect('/habits')


@habits_bp.route('/habits')
def index():  # type: ignore[no-untyped-def]
    """Render the Habits page.

    The template contains a ``[data-island="habits"]`` mount point that the
    frontend hydrates with the full HabitApp UI (table, calendar, legend,
    editor) via ``frontend/src/islands/habits/``.
    """
    return render_template('habits.html')
