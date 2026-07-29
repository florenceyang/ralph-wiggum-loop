"""Views (routes) package.

Blueprint registration for all application routes.
Each view module defines a Blueprint with its routes.
"""
from flask import Flask


def register_blueprints(app: Flask) -> None:
    """Register all blueprints with the Flask application.

    Args:
        app: Flask application instance
    """
    from .habits import habits_bp
    from .api_habits import api_habits_bp
    from .api_entries import api_entries_bp

    app.register_blueprint(habits_bp)
    app.register_blueprint(api_habits_bp)
    app.register_blueprint(api_entries_bp)
