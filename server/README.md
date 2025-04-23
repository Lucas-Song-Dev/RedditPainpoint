# Reddit Pain Point Analyzer API

A Flask-based API for scraping Reddit and analyzing user pain points with software products. The API uses JWT authentication for secure access and provides endpoints for data collection, analysis, and recommendations.

## Features

- **Reddit Data Scraping**: Uses PRAW to collect posts mentioning target products
- **Pain Point Analysis**: Identifies and categorizes common issues mentioned by users
- **Sentiment Analysis**: Determines the emotional tone of user feedback
- **OpenAI Integration**: Advanced analysis of pain points using OpenAI's API
- **MongoDB Integration**: Persistent storage for all data
- **JWT Authentication**: Secure access to API endpoints

## Environment Setup

The API requires the following environment variables:
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET_KEY=your_jwt_secret_key
MONGODB_URI=your_mongodb_connection_string

## VENV python setup

```

python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

```

## API Endpoints

### Authentication

#### Register User

POST /api/register

Register a new user account.
**Request Body:**

```json
{
  "username": "your_username",
  "password": "your_password",
  "email": "your_email@example.com" (optional)
}
Response:

{
  "status": "success",
  "message": "User registered successfully"
}
Status Codes:

201: User created successfully
400: Missing required fields
409: Username already exists
500: Server error
Login
POST /api/login
Authenticate and receive a JWT token.

Request Body:

{
  "username": "your_username",
  "password": "your_password"
}
Response:

{
  "status": "success",
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2025-04-15T12:34:56"
}
Status Codes:

200: Authentication successful
400: Missing required fields
401: Invalid credentials
500: Server error
The response includes an HTTP-only cookie with the JWT token.

Logout
POST /api/logout
Invalidate the current session.

Response:

{
  "status": "success",
  "message": "Logout successful"
}
Status Codes:

200: Logout successful
Data Collection
Scrape Posts
POST /api/scrape
Start a scraping job for Reddit posts. Requires authentication.

Request Body:

{
  "products": ["cursor", "replit"],
  "limit": 100,
  "subreddits": ["programming", "webdev", "python"],
  "time_filter": "month",
  "use_openai": true
}
All parameters are optional with defaults.

Response:

{
  "status": "success",
  "message": "Scraping job started",
  "products": ["cursor", "replit"],
  "limit": 100,
  "subreddits": ["programming", "webdev", "python"],
  "time_filter": "month",
  "use_openai": true
}
Status Codes:

200: Scraping job started
401: Unauthorized
409: A scraping job is already in progress
500: Server error or API credentials not configured
Reset Scrape Status
POST /api/reset-scrape-status
Reset the scrape_in_progress flag if a scraping job is stuck. Requires authentication.

Response:

{
  "status": "success",
  "message": "Scrape status reset successfully"
}
Status Codes:

200: Status reset successfully
401: Unauthorized
Data Retrieval
Get Posts
GET /api/posts
Get all scraped posts with filtering options. Requires authentication.

Query Parameters:

product (string, optional): Filter by product name
limit (integer, optional): Limit number of results
has_pain_points (boolean, optional): Only return posts with identified pain points
subreddit (string, optional): Filter by subreddit name
min_score (integer, optional): Minimum score threshold
min_comments (integer, optional): Minimum comments threshold
sort_by (string, optional): Field to sort by ('date', 'score', 'comments', 'sentiment'). Default: 'date'
sort_order (string, optional): Sort order ('asc' or 'desc'). Default: 'desc'
Response:

{
  "status": "success",
  "count": 25,
  "posts": [
    {
      "id": "post-id-1",
      "title": "Cursor keeps crashing on large files",
      "author": "username",
      "subreddit": "programming",
      "url": "https://reddit.com/r/programming/...",
      "created_utc": "2023-08-14T15:30:00",
      "score": 45,
      "num_comments": 23,
      "sentiment": -0.65,
      "topics": ["performance", "stability"],
      "pain_points": ["Crashes on large files", "Memory usage"],
      "products": ["cursor"]
    }
  ],
  "filters_applied": {
    "product": "Cursor",
    "has_pain_points": true,
    "subreddit": null,
    "min_score": 0,
    "min_comments": 0
  },
  "sort": {
    "field": "date",
    "order": "desc"
  },
  "last_updated": "2023-08-15T10:30:45",
  "data_source": "mongodb"
}
Status Codes:

200: Success
400: Invalid query parameters
401: Unauthorized
Get Pain Points
GET /api/pain-points
Get all identified pain points. Requires authentication.

Query Parameters:

product (string, optional): Filter by product name
limit (integer, optional): Limit number of results
min_severity (float, optional): Minimum severity score (0-1)
Response:

{
  "status": "success",
  "count": 12,
  "pain_points": [
    {
      "id": "pain-point-id-1",
      "name": "Slow Performance",
      "description": "Users complain about lag and slowness",
      "product": "Cursor",
      "frequency": 15,
      "avg_sentiment": -0.75,
      "severity": 0.85,
      "related_posts": ["post-id-1", "post-id-2"],
      "topics": ["performance"]
    }
  ],
  "last_updated": "2023-08-15T10:30:45"
}
Status Codes:

200: Success
401: Unauthorized
Get OpenAI Analysis
GET /api/openai-analysis
Get the OpenAI analysis of pain points. Requires authentication.

Query Parameters:

products[] (array, optional): List of product names to filter by
Response:

{
  "status": "success",
  "openai_enabled": true,
  "analyses": [
    {
      "product": "Cursor",
      "analysis_timestamp": "2023-08-15T10:30:45",
      "common_pain_points": [
        {
          "name": "Performance Issues",
          "description": "Users report slowdowns and lag, particularly with large files or projects.",
          "severity": "high",
          "potential_solutions": "Optimize memory usage, add file splitting feature",
          "related_keywords": ["slow", "lag", "freeze", "performance"]
        }
      ],
      "analysis_summary": "Cursor users primarily experience issues with performance, stability, and code completion accuracy."
    }
  ]
}
Status Codes:

200: Success
401: Unauthorized
500: OpenAI API key not configured
Get Recommendations
GET /api/recommendations
Get saved recommendations for addressing pain points. Requires authentication.

Query Parameters:

products[] (array, optional): List of product names to get recommendations for
Response:

{
  "status": "success",
  "recommendations": [
    {
      "product": "Cursor",
      "timestamp": "2023-08-15T10:30:45",
      "recommendations": [
        {
          "title": "Performance Optimization Extension",
          "description": "Create a browser extension that optimizes Cursor's performance by...",
          "complexity": "medium",
          "impact": "high",
          "addresses_pain_points": ["Slow Performance", "Memory Usage"],
          "most_recent_occurence": "2023-08-14"
        }
      ],
      "summary": "These recommendations focus on addressing the most critical performance and stability issues..."
    }
  ]
}
Status Codes:

200: Success
401: Unauthorized
500: Database error
Generate New Recommendations
POST /api/recommendations
Generate new recommendations based on analyses using OpenAI. Requires authentication.

Request Body:

{
  "products": ["cursor", "replit"]
}
Response:
Same format as GET /api/recommendations

Status Codes:

200: Success
401: Unauthorized
500: OpenAI API key not configured or server error
Get Status
GET /api/status
Get current status of the scraper and data store. Requires authentication.

Response:

{
  "status": "success",
  "scrape_in_progress": false,
  "last_scrape_time": "2023-08-15T10:30:45",
  "raw_posts_count": 150,
  "analyzed_posts_count": 150,
  "pain_points_count": 25,
  "subreddits_scraped": ["programming", "webdev", "python"],
  "has_openai_analyses": true,
  "openai_analyses_count": 2,
  "apis": {
    "reddit": "connected",
    "openai": "connected"
  }
}
Status Codes:

200: Success
401: Unauthorized
Authentication Requirements
All API endpoints (except register and login) require a JWT token for authentication. The token can be provided in one of two ways:

As an HTTP-only cookie (automatically included by browsers)
In the Authorization header as a Bearer token:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Error Handling
All API endpoints return a consistent error format:

{
  "status": "error",
  "message": "Error description"
}
Common error status codes:

400: Bad Request (invalid parameters)
401: Unauthorized (missing or invalid authentication)
404: Not Found (resource doesn't exist)
409: Conflict (e.g., duplicate resource)
500: Internal Server Error
MongoDB Integration
The API uses MongoDB for persistent storage of:

Reddit posts
Pain points
OpenAI analyses
Recommendations
User data
When MongoDB is not configured, the API falls back to in-memory storage, but data won't persist across restarts.

Using the API with OpenAI
To use OpenAI for analysis, set the OPENAI_API_KEY environment variable. The OpenAI integration provides:

Analysis of pain points with severity ratings
Generated recommendations for addressing identified issues
Summaries of common user complaints
License
MIT License
```
