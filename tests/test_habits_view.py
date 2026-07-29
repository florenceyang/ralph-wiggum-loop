"""Tests for the Habits page routing.

The habit tracker is rendered client-side via a React Island; the backend's
only responsibility is to serve the HTML shell containing the island mount
point and to redirect the root path to /habits (replacing the former
Space Invaders homepage).
"""
from __future__ import annotations

import json
from typing import Any
from flask.testing import FlaskClient


class TestHabitsPage:
    """Tests for root routing behavior and the /habits page shell."""

    def test_root_redirects_to_habits(self, client: FlaskClient[Any]) -> None:
        """GET / should redirect to /habits."""
        response = client.get('/')
        assert response.status_code in (301, 302)
        location = response.headers.get('Location', '')
        assert '/habits' in location

    def test_habits_page_returns_html(self, client: FlaskClient[Any]) -> None:
        """GET /habits should return a 200 HTML page with the habit app shell."""
        response = client.get('/habits')
        assert response.status_code == 200
        assert b'Habit Tracker' in response.data
        assert b'<title>Habits</title>' in response.data
        assert b'data-island="habits"' in response.data


class TestErrorHandlers:
    """Tests for error handling.

    Retained from the original scaffold so that error-handler coverage
    (content negotiation between HTML and JSON) survives the Hello removal.
    """

    def test_404_html(self, client: FlaskClient[Any]) -> None:
        """404 should return HTML for browser requests."""
        response = client.get('/nonexistent')
        assert response.status_code == 404
        assert b'Page Not Found' in response.data or b'404' in response.data

    def test_404_json(self, client: FlaskClient[Any]) -> None:
        """404 should return JSON for API requests."""
        response = client.get(
            '/nonexistent',
            headers={'Accept': 'application/json'}
        )
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
