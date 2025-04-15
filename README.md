# Reddit Pain Point Analyzer

A Flask-based web application that scrapes Reddit for mentions of software products (e.g., Cursor, Replit) and uses NLP techniques to identify common pain points that users experience with these products. This analysis can help identify opportunities for creating browser extensions or other tools to address these pain points.

## Features

- **Reddit Data Scraping**: Uses PRAW to collect posts mentioning target products
- **Pain Point Analysis**: Identifies and categorizes common issues mentioned by users
- **Sentiment Analysis**: Determines the emotional tone of user feedback
- **OpenAI Integration**: Advanced analysis of pain points using OpenAI's API
- **Visualization Dashboard**: Interactive admin page for viewing and exploring the data
- **RESTful API**: Well-documented endpoints for programmatic access
- **User Authentication**: Secure JWT-based authentication system

## Getting Started

### Prerequisites

- Python 3.8+
- MongoDB database (optional, but recommended for production)

### Environment Variables

The application uses the following environment variables on backend:
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=your_mongodb_connection_string

You can set these in a `.env` file in the project root or as system environment variables.

### Installation

1. Clone the repository:
   git clone https://github.com/yourusername/reddit-pain-point-analyzer.git
   cd reddit-pain-point-analyzer

2. Install dependencies using pip:
   pip install -r requirements.txt

3. Run the application:
   python main.py

### Running with a Virtual Environment

For a cleaner installation, you can use a virtual environment:

1. Create a virtual environment:
   python -m venv venv

2. Activate the virtual environment:

- On Windows:
  ```
  venv\Scripts\activate
  ```
- On macOS/Linux:
  ```
  source venv/bin/activate
  ```

3. Install dependencies:
   pip install -r requirements.txt

4. Run the application:
   python main.py

5. To deactivate the virtual environment when you're done:
   deactivate

## API Authentication

The API uses JWT (JSON Web Token) based authentication:

1. Register a user:
   POST /api/register
   {
   "username": "your_username",
   "password": "your_password",
   "email": "your_email@example.com" (optional)
   }

2. Login to get a token:
   POST /api/login
   {
   "username": "your_username",
   "password": "your_password"
   }

3. Use the token in subsequent requests:

- As a cookie (automatically handled by the browser)
- As a Bearer token in the Authorization header:
  ```
  Authorization: Bearer your_jwt_token
  ```

## API Documentation

### API Endpoints

#### Scrape Posts

POST /api/scrape

Start a scraping job for Reddit posts.
**Request Parameters:**

- `products` (array, optional): List of product names to scrape. Defaults to ["cursor", "replit"].
- `limit` (integer, optional): Maximum number of posts to scrape per product. Defaults to 100.
- `subreddits` (array, optional): List of subreddits to search. If not provided, searches default subreddits.
- `time_filter` (string, optional): Time period to search ('day', 'week', 'month', 'year', 'all'). Defaults to 'month'.
- `use_openai` (boolean, optional): Whether to use OpenAI to analyze common pain points. Defaults to false.
  **Response:**

```json
{
  "status": "success",
  "message": "Scraping job started",
  "products": ["cursor", "replit"],
  "limit": 100,
  "subreddits": ["programming", "webdev", "python"],
  "time_filter": "month",
  "use_openai": true
}
Get Posts, Pain Points & Analysis
The API provides multiple endpoints for accessing the scraped and analyzed data:

GET /api/posts: Retrieve scraped posts with filtering options
GET /api/pain-points: Get identified pain points with severity filtering
GET /api/openai-analysis: Get OpenAI-generated analysis of pain points
GET /api/recommendations: Get saved recommendations for addressing pain points
POST /api/recommendations: Generate new recommendations based on pain points
```
