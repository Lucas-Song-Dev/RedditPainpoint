import os
import logging
from flask import Flask
from flask_cors import CORS
from flask_restful import Api
import nltk

# Safe download if not already available
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Enable CORS
CORS(app)

# Initialize Flask-RESTful API
api = Api(app)

# Initialize in-memory data store
# This will hold our scraped and analyzed data
class DataStore:
    def __init__(self):
        self.raw_posts = []
        self.analyzed_posts = []
        self.pain_points = {}
        self.subreddits_scraped = set()
        self.last_scrape_time = None
        self.scrape_in_progress = False
        self.openai_analyses = {}

# Create a singleton instance of DataStore
data_store = DataStore()

# Import routes after app initialization to avoid circular imports
from api import initialize_routes
initialize_routes(api)

# Import and register the main blueprint
from routes import main_bp
app.register_blueprint(main_bp)

logger.info("App initialized successfully")
