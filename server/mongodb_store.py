import os
import logging
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure

logger = logging.getLogger(__name__)

class MongoDBStore:
    """MongoDB data store for Reddit scraper application"""
    
    def __init__(self, mongodb_uri=None):
        """Initialize MongoDB connection"""
        self.mongodb_uri = mongodb_uri or os.getenv("MONGODB_URI")
        self.client = None
        self.db = None
        self.scrape_in_progress = False
        self.pain_points = {}
        self.raw_posts = []
        self.analyzed_posts = []
        self.subreddits_scraped = set()
        self.last_scrape_time = None
        self.openai_analyses = {}
        
        # Connect to MongoDB if URI is provided
        if self.mongodb_uri:
            self.connect()
    
    def connect(self):
        """Connect to MongoDB database"""
        try:
            self.client = MongoClient(self.mongodb_uri)
            # Test connection
            self.client.admin.command('ping')
            # Use 'reddit_scraper' database
            self.db = self.client.reddit_scraper
            logger.info("Connected to MongoDB successfully")
            
            # Load current metadata if available
            self._load_metadata()
            self.load_pain_points()
            return True
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {str(e)}")
            return False
    
    def _load_metadata(self):
        """Load metadata from database"""
        try:
            # Fix the comparison with None instead of bool testing
            if self.db is not None:
                metadata = self.db.metadata.find_one({"_id": "scraper_metadata"})
                if metadata:
                    self.scrape_in_progress = metadata.get("scrape_in_progress", False)
                    self.last_scrape_time = metadata.get("last_updated")
                    logger.info(f"Loaded metadata, scrape_in_progress: {self.scrape_in_progress}")
        except Exception as e:
            logger.error(f"Error loading metadata: {str(e)}")
    
    def update_metadata(self, scrape_in_progress=None, products=None, subreddits=None, time_filter=None):
        """Update scraper metadata in the database"""
        # Fix the comparison with None instead of bool testing
        if self.db is None:
            logger.error("Cannot update metadata: Database connection not established")
            return False
        
        try:
            # Prepare update data
            update_data = {"last_updated": datetime.utcnow()}
            
            # Only update fields that are provided
            if scrape_in_progress is not None:
                update_data["scrape_in_progress"] = scrape_in_progress
                self.scrape_in_progress = scrape_in_progress
            
            if products:
                update_data["products"] = products
                
            if subreddits:
                update_data["subreddits"] = subreddits
                if subreddits:
                    self.subreddits_scraped.update(subreddits)
                
            if time_filter:
                update_data["time_filter"] = time_filter
            
            # Update or insert metadata document
            result = self.db.metadata.update_one(
                {"_id": "scraper_metadata"},
                {"$set": update_data},
                upsert=True
            )
            
            self.last_scrape_time = update_data["last_updated"]
            
            logger.info(f"Updated metadata: {update_data}")
            return True
        except Exception as e:
            logger.error(f"Error updating metadata: {str(e)}")
            return False
    def save_post(self, post):
        """Save Reddit post to database"""
        # Fix the comparison with None instead of bool testing
        if self.db is None:
            logger.error("Cannot save post: Database connection not established")
            return False
        
        try:
            # Convert post object to dictionary if needed
            if hasattr(post, 'to_dict'):
                post_data = post.to_dict()
            elif isinstance(post, dict):
                post_data = post
            else:
                # Try to convert object attributes to dictionary
                post_data = {}
                for attr in dir(post):
                    if not attr.startswith('__') and not callable(getattr(post, attr)):
                        post_data[attr] = getattr(post, attr)
            
            # Add timestamp if not present
            if 'created_at' not in post_data:
                post_data['created_at'] = datetime.utcnow()
            
            # Get post ID - either from id attribute or from the 'id' key
            post_id = None
            if hasattr(post, 'id'):
                post_id = post.id
            elif 'id' in post_data:
                post_id = post_data['id']
                
            if not post_id:
                logger.error("Cannot save post: No ID available")
                return False
                
            # Use post ID as document ID
            post_data['_id'] = post_id
            
            # Convert any non-serializable objects to strings
            for key, value in post_data.items():
                if not isinstance(value, (str, int, float, bool, list, dict, datetime, type(None))):
                    post_data[key] = str(value)
            
            # Insert or update post
            result = self.db.posts.update_one(
                {"_id": post_data['_id']},
                {"$set": post_data},
                upsert=True
            )
            
            # Add to raw_posts list if it's not already there
            if post_id not in [p.id if hasattr(p, 'id') else p.get('id', None) for p in self.raw_posts]:
                self.raw_posts.append(post)
            
            return True
        except Exception as e:
            logger.error(f"Error saving post: {str(e)}")
            return False
    
    def save_pain_point(self, pain_point):
        """Save pain point to database and local cache"""
        # Fix the comparison with None instead of bool testing
        if self.db is None:
            logger.error("Cannot save pain point: Database connection not established")
            return False
        
        try:
            # Convert pain point object to dictionary if needed
            pain_data = pain_point.to_dict() if hasattr(pain_point, 'to_dict') else pain_point
            
            # Add timestamp if not present
            if 'created_at' not in pain_data:
                pain_data['created_at'] = datetime.utcnow()
            
            # Use custom ID or generate one
            pain_id = pain_data.get('id', str(hash(f"{pain_data['product']}_{pain_data['topic']}")))
            pain_data['_id'] = pain_id
            
            # Update local cache
            self.pain_points[pain_id] = pain_point
            
            # Insert or update in database
            result = self.db.pain_points.update_one(
                {"_id": pain_id},
                {"$set": pain_data},
                upsert=True
            )
            
            return True
        except Exception as e:
            logger.error(f"Error saving pain point: {str(e)}")
            return False
    
    def save_openai_analysis(self, product, analysis):
        """Save OpenAI analysis to database"""
        # Fix the comparison with None instead of bool testing
        if self.db is None:
            logger.error("Cannot save OpenAI analysis: Database connection not established")
            return False
        
        try:
            # Prepare analysis document
            analysis_data = {
                "product": product,
                "analysis": analysis,
                "created_at": datetime.utcnow()
            }
            
            # Use product name as ID
            analysis_data['_id'] = product
            
            # Insert or update analysis
            result = self.db.openai_analysis.update_one(
                {"_id": product},
                {"$set": analysis_data},
                upsert=True
            )
            
            # Update local cache
            self.openai_analyses[product] = analysis
            
            return True
        except Exception as e:
            logger.error(f"Error saving OpenAI analysis: {str(e)}")
            return False
    
    def load_pain_points(self):
        """Load pain points from database to local cache"""
        # Fix the comparison with None instead of bool testing
        if self.db is None:
            logger.error("Cannot load pain points: Database connection not established")
            return
        
        try:
            # Clear current cache
            self.pain_points = {}
            
            # Query all pain points from database
            pain_points_cursor = self.db.pain_points.find({})
            
            # Rebuild cache
            for pain_point in pain_points_cursor:
                pain_id = pain_point['_id']
                self.pain_points[pain_id] = pain_point
                
            logger.info(f"Loaded {len(self.pain_points)} pain points from database")
        except Exception as e:
            logger.error(f"Error loading pain points: {str(e)}")
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection")