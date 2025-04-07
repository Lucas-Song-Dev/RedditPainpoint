# mongodb_store.py
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from datetime import datetime
import logging
import json
from bson import json_util

# Configure logger
logger = logging.getLogger(__name__)

class MongoDBStore:
    """MongoDB-based data store for the Reddit scraper application"""
    
    def __init__(self, uri):
        """
        Initialize the MongoDB connection
        
        Args:
            uri (str): MongoDB connection string
        """
        self.uri = uri
        self.client = None
        self.db = None
        self.scrape_in_progress = False
        self.last_scrape_time = None
        self.connect()
        
    def connect(self):
        """Establish connection to MongoDB"""
        try:
            self.client = MongoClient(self.uri, server_api=ServerApi('1'))
            self.db = self.client.reddit_scraper  # Use 'reddit_scraper' database
            
            # Create indexes for better performance
            self._create_indexes()
            
            # Load the last scrape time from metadata
            metadata = self.db.metadata.find_one({"key": "last_scrape"})
            if metadata:
                self.last_scrape_time = metadata.get("timestamp")
                self.scrape_in_progress = metadata.get("scrape_in_progress", False)
            
            logger.info("Successfully connected to MongoDB")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            return False
    
    def _create_indexes(self):
        """Create MongoDB indexes for better query performance"""
        try:
            # Posts collection indexes
            self.db.posts.create_index("id", unique=True)
            self.db.posts.create_index("products")
            self.db.posts.create_index("subreddit")
            self.db.posts.create_index("created_at")
            
            # Pain points collection indexes
            self.db.pain_points.create_index([("name", 1), ("product", 1)])
            self.db.pain_points.create_index("severity")
            
            # OpenAI analyses collection indexes
            self.db.openai_analyses.create_index("product", unique=True)
            
            logger.info("Created MongoDB indexes")
        except Exception as e:
            logger.error(f"Error creating MongoDB indexes: {str(e)}")
    
    def save_post(self, post):
        """
        Save a post to MongoDB
        
        Args:
            post (RedditPost): The post to save
        """
        try:
            # Convert post object to dictionary
            post_dict = {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "author": post.author,
                "subreddit": post.subreddit,
                "url": post.url,
                "created_at": post.created_at,
                "score": post.score,
                "num_comments": post.num_comments,
                "sentiment": getattr(post, 'sentiment', 0),
                "pain_points": getattr(post, 'pain_points', []),
                "topics": getattr(post, 'topics', []),
                "products": getattr(post, 'products', [])
            }
            
            # Use upsert to avoid duplicates
            self.db.posts.update_one(
                {"id": post.id}, 
                {"$set": post_dict}, 
                upsert=True
            )
            
            return True
        except Exception as e:
            logger.error(f"Error saving post to MongoDB: {str(e)}")
            return False
    
    def save_pain_point(self, pain_point):
        """
        Save a pain point to MongoDB
        
        Args:
            pain_point (PainPoint): The pain point to save
        """
        try:
            # Convert pain point to dictionary
            pain_point_dict = {
                "name": pain_point.name,
                "description": pain_point.description,
                "product": pain_point.product,
                "frequency": pain_point.frequency,
                "avg_sentiment": pain_point.avg_sentiment,
                "severity": pain_point.severity,
                "related_posts": pain_point.related_posts
            }
            
            # Use upsert to avoid duplicates
            self.db.pain_points.update_one(
                {"name": pain_point.name, "product": pain_point.product}, 
                {"$set": pain_point_dict}, 
                upsert=True
            )
            
            return True
        except Exception as e:
            logger.error(f"Error saving pain point to MongoDB: {str(e)}")
            return False
    
    def save_openai_analysis(self, product, analysis):
        """
        Save OpenAI analysis results to MongoDB
        
        Args:
            product (str): The product name
            analysis (dict): The analysis results
        """
        try:
            # Prepare analysis document
            analysis_dict = {
                "product": product,
                "analysis_summary": analysis.get("summary", ""),
                "common_pain_points": analysis.get("pain_points", []),
                "timestamp": datetime.now()
            }
            
            # Use upsert to avoid duplicates
            self.db.openai_analyses.update_one(
                {"product": product}, 
                {"$set": analysis_dict}, 
                upsert=True
            )
            
            return True
        except Exception as e:
            logger.error(f"Error saving OpenAI analysis to MongoDB: {str(e)}")
            return False
    
    def save_recommendation(self, product, recommendations):
        """
        Save product recommendations to MongoDB
        
        Args:
            product (str): The product name
            recommendations (dict): The recommendations results
        """
        try:
            # Add product to recommendations if not present
            if "product" not in recommendations:
                recommendations["product"] = product
            
            # Add timestamp if not present
            if "timestamp" not in recommendations:
                recommendations["timestamp"] = datetime.now()
            
            # Use upsert to avoid duplicates
            self.db.recommendations.update_one(
                {"product": product}, 
                {"$set": recommendations}, 
                upsert=True
            )
            
            return True
        except Exception as e:
            logger.error(f"Error saving recommendations to MongoDB: {str(e)}")
            return False
    
    def update_metadata(self, scrape_in_progress=None, products=None, subreddits=None, time_filter=None):
        """
        Update metadata about the scraping process
        
        Args:
            scrape_in_progress (bool): Whether a scrape is in progress
            products (list): List of products being scraped
            subreddits (list): List of subreddits being scraped
            time_filter (str): Time filter used for scraping
        """
        try:
            update_data = {"timestamp": datetime.now()}
            
            if scrape_in_progress is not None:
                update_data["scrape_in_progress"] = scrape_in_progress
                self.scrape_in_progress = scrape_in_progress
            
            if products is not None:
                update_data["products"] = products
            
            if subreddits is not None:
                update_data["subreddits"] = subreddits
            
            if time_filter is not None:
                update_data["time_filter"] = time_filter
            
            self.db.metadata.update_one(
                {"key": "last_scrape"}, 
                {"$set": update_data}, 
                upsert=True
            )
            
            # Update the last scrape time
            self.last_scrape_time = datetime.now()
            
            return True
        except Exception as e:
            logger.error(f"Error updating metadata in MongoDB: {str(e)}")
            return False
    
    def get_posts(self, filters=None, limit=100, sort_by="created_at", sort_order="desc"):
        """
        Get posts from MongoDB with optional filtering
        
        Args:
            filters (dict): MongoDB query filters
            limit (int): Maximum number of posts to return
            sort_by (str): Field to sort by
            sort_order (str): Sort order ('asc' or 'desc')
            
        Returns:
            list: List of posts
        """
        try:
            # Build the query
            query = {} if filters is None else filters
            
            # Determine sort direction
            sort_direction = -1 if sort_order.lower() == "desc" else 1
            
            # Execute the query
            cursor = self.db.posts.find(
                query, 
                {'_id': 0}  # Exclude MongoDB _id
            ).sort(sort_by, sort_direction).limit(limit)
            
            # Convert cursor to list
            posts = list(cursor)
            
            return posts
        except Exception as e:
            logger.error(f"Error retrieving posts from MongoDB: {str(e)}")
            return []
    
    def get_pain_points(self, filters=None, limit=100, min_severity=0):
        """
        Get pain points from MongoDB with optional filtering
        
        Args:
            filters (dict): MongoDB query filters
            limit (int): Maximum number of pain points to return
            min_severity (float): Minimum severity score
            
        Returns:
            list: List of pain points
        """
        try:
            # Build the query
            query = {} if filters is None else filters
            
            # Add severity filter if provided
            if min_severity > 0:
                query["severity"] = {"$gte": min_severity}
            
            # Execute the query
            cursor = self.db.pain_points.find(
                query, 
                {'_id': 0}  # Exclude MongoDB _id
            ).sort("severity", -1).limit(limit)
            
            # Convert cursor to list
            pain_points = list(cursor)
            
            return pain_points
        except Exception as e:
            logger.error(f"Error retrieving pain points from MongoDB: {str(e)}")
            return []
    
    def get_openai_analyses(self, product=None):
        """
        Get OpenAI analyses from MongoDB
        
        Args:
            product (str): Specific product to get analysis for
            
        Returns:
            list: List of analyses
        """
        try:
            # Build the query
            query = {}
            if product:
                query["product"] = product
            
            # Execute the query
            cursor = self.db.openai_analyses.find(
                query, 
                {'_id': 0}  # Exclude MongoDB _id
            )
            
            # Convert cursor to list
            analyses = list(cursor)
            
            return analyses
        except Exception as e:
            logger.error(f"Error retrieving OpenAI analyses from MongoDB: {str(e)}")
            return []
    
    def get_recommendations(self, product=None):
        """
        Get recommendations from MongoDB
        
        Args:
            product (str): Specific product to get recommendations for
            
        Returns:
            list: List of recommendations
        """
        try:
            # Build the query
            query = {}
            if product:
                query["product"] = product
            
            # Execute the query
            cursor = self.db.recommendations.find(
                query, 
                {'_id': 0}  # Exclude MongoDB _id
            )
            
            # Convert cursor to list
            recommendations = list(cursor)
            
            return recommendations
        except Exception as e:
            logger.error(f"Error retrieving recommendations from MongoDB: {str(e)}")
            return []
    
    def get_stats(self):
        """
        Get statistics about the data in MongoDB
        
        Returns:
            dict: Statistics about the data
        """
        try:
            # Get counts
            post_count = self.db.posts.count_documents({})
            pain_point_count = self.db.pain_points.count_documents({})
            analysis_count = self.db.openai_analyses.count_documents({})
            
            # Get metadata
            metadata = self.db.metadata.find_one({"key": "last_scrape"})
            
            # Get unique subreddits
            subreddits = self.db.posts.distinct("subreddit")
            
            return {
                "post_count": post_count,
                "pain_point_count": pain_point_count,
                "analysis_count": analysis_count,
                "last_scrape_time": self.last_scrape_time,
                "scrape_in_progress": self.scrape_in_progress,
                "subreddits": subreddits,
                "metadata": metadata
            }
        except Exception as e:
            logger.error(f"Error retrieving stats from MongoDB: {str(e)}")
            return {}