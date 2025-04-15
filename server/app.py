import os
import logging
from flask import Flask
from flask_cors import CORS
from flask_restful import Api
import nltk
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Safe download if not already available
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logging.getLogger("pymongo").setLevel(logging.WARNING)
logging.getLogger("pymongo.connection").setLevel(logging.WARNING)
logging.getLogger("pymongo.topology").setLevel(logging.WARNING)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Enable CORS
# CORS(app)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173", "supports_credentials": True}})


# Initialize Flask-RESTful API
api = Api(app)

# Import and initialize MongoDB store
from mongodb_store import MongoDBStore

# Create a MongoDB store instance
data_store = MongoDBStore(os.getenv("MONGODB_URI"))
data_store.scrape_in_progress = False
data_store.update_metadata(scrape_in_progress=False)

# Import routes after app initialization to avoid circular imports
from api import initialize_routes
initialize_routes(api)

# Import and register the main blueprint
from routes import main_bp
app.register_blueprint(main_bp)

logger.info("App initialized successfully")