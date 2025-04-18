import pytest
from app import app

def test_app_creation():
    """Test that the app is created correctly."""
    assert app is not None
    assert app.config['TESTING'] is True

def test_register_endpoint_exists(client):
    """Test that the register endpoint exists."""
    response = client.post('/api/register')
    assert response.status_code != 404  # Should not be a 404 Not Found

def test_login_endpoint_exists(client):
    """Test that the login endpoint exists."""
    response = client.post('/api/login')
    assert response.status_code != 404  # Should not be a 404 Not Found

def test_protected_route_requires_auth(client):
    """Test that protected routes require authentication."""
    response = client.get('/api/painpoints')
    assert response.status_code == 401  # Unauthorized

def test_protected_route_with_mock_auth(client, mock_auth_headers):
    """Test protected route with mock authentication."""
    response = client.get('/api/painpoints', headers=mock_auth_headers)
    assert response.status_code != 401  # Should not be unauthorized
    assert response.status_code != 404  # Should not be not found

def test_api_routes_exist(client):
    """Test that all API routes exist."""
    routes = [
        '/api/register',
        '/api/login',
        '/api/logout',
        '/api/painpoints',
        '/api/posts',
        '/api/recommendations',
        '/api/status'
    ]
    
    for route in routes:
        response = client.get(route)
        assert response.status_code != 404, f"Route {route} not found"

def test_register(client, test_user):
    """Test user registration endpoint."""
    response = client.post('/api/register', json=test_user)
    assert response.status_code == 201
    assert 'message' in response.json
    assert response.json['message'] == 'User registered successfully'

def test_register_duplicate_user(client, test_user):
    """Test registering a duplicate user."""
    # First registration
    client.post('/api/register', json=test_user)
    
    # Second registration attempt
    response = client.post('/api/register', json=test_user)
    assert response.status_code == 400
    assert 'error' in response.json

def test_login(client, test_user):
    """Test user login endpoint."""
    # First register the user
    client.post('/api/register', json=test_user)
    
    # Then try to login
    response = client.post('/api/login', json=test_user)
    assert response.status_code == 200
    assert 'access_token' in response.json

def test_login_invalid_credentials(client, test_user):
    """Test login with invalid credentials."""
    # Register the user
    client.post('/api/register', json=test_user)
    
    # Try to login with wrong password
    invalid_credentials = {
        'username': test_user['username'],
        'password': 'wrongpassword'
    }
    response = client.post('/api/login', json=invalid_credentials)
    assert response.status_code == 401
    assert 'error' in response.json

def test_protected_route_without_token(client):
    """Test accessing a protected route without a token."""
    response = client.get('/api/painpoints')
    assert response.status_code == 401
    assert 'error' in response.json

def test_protected_route_with_token(client, auth_headers):
    """Test accessing a protected route with a valid token."""
    response = client.get('/api/painpoints', headers=auth_headers)
    assert response.status_code == 200 