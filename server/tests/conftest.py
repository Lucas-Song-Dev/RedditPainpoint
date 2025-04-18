import pytest
from flask import Flask
from flask_restful import Api
import os

@pytest.fixture(scope='session')
def app():
    """Create a test Flask app."""
    # Set test environment variables
    os.environ['MONGODB_URI'] = 'mongodb://localhost:27017/test_db'
    os.environ['REDDIT_CLIENT_ID'] = 'test_client_id'
    os.environ['REDDIT_CLIENT_SECRET'] = 'test_client_secret'
    os.environ['OPENAI_API_KEY'] = 'test_api_key'
    os.environ['JWT_SECRET_KEY'] = 'test_jwt_secret'
    os.environ['SESSION_SECRET'] = 'test_session_secret'
    
    # Create and configure the app
    app = Flask(__name__)
    app.config.update({
        'TESTING': True,
        'SECRET_KEY': os.environ['SESSION_SECRET'],
        'MONGODB_URI': os.environ['MONGODB_URI']
    })
    
    # Initialize the API
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