import pytest
from app import app, api
from flask import Flask
import os

@pytest.fixture(scope='session')
def app():
    """Create a test Flask app."""
    app = Flask(__name__)
    app.config.update({
        'TESTING': True,
        'SECRET_KEY': 'test-secret-key',
        'MONGODB_URI': 'mongodb://localhost:27017/test_db'
    })
    
    # Initialize the API
    from flask_restful import Api
    api = Api(app)
    
    # Import and register routes
    from api import initialize_routes
    initialize_routes(api)
    
    return app

@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()

@pytest.fixture
def test_user():
    """Create a test user for authentication tests."""
    return {
        'username': 'testuser',
        'password': 'testpass123'
    }

@pytest.fixture
def mock_auth_headers():
    """Create mock authentication headers for testing."""
    return {
        'Authorization': 'Bearer mock-token'
    } 