# Reddit Pain Point Analyzer

A Flask-based web application that scrapes Reddit for mentions of software products (e.g., Cursor, Replit) and uses NLP techniques to identify common pain points that users experience with these products. This analysis can help identify opportunities for creating browser extensions or other tools to address these pain points.

## Features

- **Reddit Data Scraping**: Uses PRAW to collect posts mentioning target products
- **Pain Point Analysis**: Identifies and categorizes common issues mentioned by users
- **Sentiment Analysis**: Determines the emotional tone of user feedback
- **OpenAI Integration**: Optional advanced analysis of pain points using OpenAI's API
- **Visualization Dashboard**: Static admin page for viewing and exploring the data
- **RESTful API**: Well-documented endpoints for programmatic access

## Getting Started

### Prerequisites

- Python 3.8+
- Reddit API credentials
- (Optional) OpenAI API key for advanced analysis

### Installation

1. Clone the repository
2. Create a `.env` file with your credentials (see `.env.example` for format)
3. Install dependencies: `pip install -r requirements.txt`
4. Run the application: `python main.py`

## API Documentation

### API Endpoints

#### Scrape Posts

```
POST /api/scrape
```

Start a scraping job for Reddit posts.

**Request Parameters:**
- `products` (array, optional): List of product names to scrape. Defaults to ["cursor", "replit"].
- `limit` (integer, optional): Maximum number of posts to scrape per product. Defaults to 100.
- `subreddits` (array, optional): List of subreddits to search. If not provided, searches all of Reddit.
- `time_filter` (string, optional): Time period to search ('day', 'week', 'month', 'year', 'all'). Defaults to 'month'.
- `use_openai` (boolean, optional): Whether to use OpenAI to analyze common pain points. Defaults to false.

**Response:**
```json
{
  "status": "success",
  "message": "Scraping started in the background",
  "scrape_id": "unique-id-for-job"
}
```

#### Get Pain Points

```
GET /api/pain-points
```

Get all identified pain points.

**Query Parameters:**
- `product` (string, optional): Filter by product name.
- `limit` (integer, optional): Limit number of results.
- `min_severity` (float, optional): Minimum severity score (0-1).

**Response:**
```json
{
  "status": "success",
  "count": 12,
  "pain_points": [
    {
      "name": "Slow Performance",
      "description": "Users complain about lag and slowness",
      "product": "Cursor",
      "frequency": 15,
      "avg_sentiment": -0.75,
      "severity": 0.85,
      "related_posts": ["post-id-1", "post-id-2"]
    },
    // More pain points...
  ],
  "last_updated": "2023-08-15T10:30:45"
}
```

#### Get Posts

```
GET /api/posts
```

Get all scraped posts.

**Query Parameters:**
- `product` (string, optional): Filter by product name.
- `limit` (integer, optional): Limit number of results.
- `has_pain_points` (boolean, optional): Only return posts with identified pain points.
- `subreddit` (string, optional): Filter by subreddit name.
- `min_score` (integer, optional): Minimum score threshold.
- `min_comments` (integer, optional): Minimum comments threshold.
- `sort_by` (string, optional): Field to sort by ('date', 'score', 'comments', 'sentiment'). Default: 'date'.
- `sort_order` (string, optional): Sort order ('asc' or 'desc'). Default: 'desc'.

**Response:**
```json
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
      "pain_points": ["Crashes on large files", "Memory usage"]
    },
    // More posts...
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
  "last_updated": "2023-08-15T10:30:45"
}
```

#### Get Status

```
GET /api/status
```

Get current status of the scraper.

**Response:**
```json
{
  "status": "success",
  "scrape_in_progress": false,
  "last_scrape_time": "2023-08-15T10:30:45",
  "raw_posts_count": 150,
  "analyzed_posts_count": 150,
  "pain_points_count": 25,
  "subreddits_scraped": ["programming", "webdev", "python"],
  "has_openai_analyses": true,
  "openai_analyses_count": 2
}
```

#### Get OpenAI Analysis

```
GET /api/openai-analysis
```

Get the OpenAI analysis of pain points.

**Query Parameters:**
- `product` (string, optional): Filter by product name.

**Response:**
```json
{
  "status": "success",
  "openai_enabled": true,
  "analyses": [
    {
      "product": "Cursor",
      "summary": "Cursor users primarily experience issues with performance, stability, and code completion accuracy.",
      "pain_points": [
        {
          "name": "Performance Issues",
          "description": "Users report slowdowns and lag, particularly with large files or projects.",
          "frequency": 28,
          "sentiment": -0.78
        },
        // More pain points...
      ],
      "recommendations": [
        {
          "title": "File Size Optimizer",
          "description": "Create an extension that optimizes large files for better performance in Cursor.",
          "complexity": "Medium",
          "impact": "High"
        },
        // More recommendations...
      ]
    },
    // More product analyses...
  ]
}
```

## Using OpenAI for Analysis

When the `use_openai` parameter is set to `true` in the scrape API call, the system uses OpenAI to perform advanced analysis of the pain points. This requires an OpenAI API key to be set in the `.env` file.

The OpenAI analysis provides:
- A summary of common pain points
- Categorized pain points with frequency and sentiment analysis
- Recommendations for potential browser extensions or tools to address these pain points

## License

MIT License