# Software Pain Point Analyzer

A tool that scrapes Reddit data to identify pain points in software products, with a responsive React frontend featuring dashboard and account pages.

## Features

- 📊 **Data Analysis**: Scrapes and analyzes Reddit data to identify common pain points in software products
- 📈 **Visualizations**: Interactive charts to view pain point distribution
- 🔍 **Product Insights**: Compare pain points across different software products
- 🔄 **Responsive UI**: Clean interface built with React and Bootstrap

## Prerequisites

- Python 3.11+
- Reddit API credentials (sign up at [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps))

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Lucas-Song-Dev/RedditPainpoint.git
cd software-pain-point-analyzer
```

### 2. Set up a virtual environment

```bash
python -m venv venv
```

Activate the virtual environment:

#### On Windows:

```bash
venv\Scripts\activate
```

#### On macOS/Linux:

```bash
source venv/bin/activate
```

### 3. Install required packages

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env` file in the root directory with the following content:

```
# Database configuration
DATABASE_URL=sqlite:///reddit_data.db

# Reddit API credentials
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=script:painpoint-scraper:v1.0 (by /u/yourusername)

# Session secret
SESSION_SECRET=your_secret_key
```

Replace the placeholder values with your actual Reddit API credentials.

## Running the Application

### Start the server

```bash
python main.py
```

Or using Gunicorn (recommended for production):

```bash
gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
```

### Access the application

Open your browser and navigate to:

```
http://localhost:5000
```

## How to Use

1. The application comes with default products (Cursor, Replit, VSCode, GitHub Copilot)
2. Select a product from the dropdown to view its pain points
3. Use the "Scrape Reddit" form to collect new data for any product
4. View detailed information about pain points and related Reddit posts
5. Explore the data visualizations to understand pain point distribution and product comparisons

## Project Structure

```
├── static/                   # Static files
│   └── js/                   # JavaScript files
│       ├── components/       # React components
│       │   ├── Account.jsx
│       │   ├── Dashboard.jsx
│       │   ├── DataVisualization.jsx
│       │   ├── Navigation.jsx
│       │   └── PainPointCard.jsx
│       ├── api.js            # API client
│       └── main.jsx          # Main React app
├── templates/                # HTML templates
│   └── index.html            # Main template
├── analyzer.py               # Pain point analysis logic
├── app.py                    # Flask app configuration
├── main.py                   # App entry point
├── models.py                 # Database models
├── reddit_scraper.py         # Reddit scraping logic
├── routes.py                 # API routes
└── requirements.txt          # Project dependencies
```

## Configuring Reddit API Credentials

To use the Reddit scraping functionality, you'll need to create a Reddit application:

1. Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Fill in the following details:
   - Name: Pain Point Analyzer (or any name you prefer)
   - App type: Script
   - Description: A tool to analyze software pain points from Reddit data
   - About URL: (leave blank)
   - Redirect URI: http://localhost:8000
4. Click "Create app"
5. Copy the Client ID (underneath the app name) and Client Secret
6. Update your `.env` file with these values

## Extending the Application

### Adding new visualization types

Modify the `DataVisualization.jsx` component to add new chart types.

### Supporting additional data sources

Extend the application to support other data sources by creating new scraper modules similar to `reddit_scraper.py`.

## Troubleshooting

### Reddit API Issues

If you encounter issues with the Reddit API, check that:

- Your credentials are correct and properly configured
- You're not exceeding the API rate limits

### Database Problems

If you encounter database issues, you can reset the database by deleting the `reddit_data.db` file and restarting the application.

## License

[MIT License](LICENSE)
