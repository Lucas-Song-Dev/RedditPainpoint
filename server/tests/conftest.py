import pytest
from app import app
import os

@pytest.fixture
def client():
    """Create a test client for the app."""
    # Use test configuration
    app.config.update({
        'TESTING': True,
        'SECRET_KEY': 'test-secret-key',
        'MONGODB_URI': 'mongodb://localhost:27017/test_db'
    })
    
    with app.test_client() as client:
        yield client

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