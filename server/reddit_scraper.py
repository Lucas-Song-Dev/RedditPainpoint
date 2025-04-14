import praw
import logging
import time
from datetime import datetime
from models import RedditPost
from app import data_store

logger = logging.getLogger(__name__)

class RedditScraper:
    """
    Handles scraping of Reddit data using PRAW.
    Focuses on scraping posts related to specific software products.
    """
    
    def __init__(self):
        # Initialize without Reddit client
        self.reddit = None
        # Target products to analyze
        self.target_products = ["cursor", "replit"]
        # Default subreddits to search
        self.default_subreddits = [
            "programming", "webdev", "learnprogramming", 
            "coding", "javascript", "python", "reactjs",
            "vscode", "IDE", "developers", "replit", "cursor_editor"
        ]
        # Available time filters
        self.time_filters = {
            "day": "past 24 hours",
            "week": "past week",
            "month": "past month",
            "year": "past year",
            "all": "all time"
        }
        
    def initialize_client(self, client_id, client_secret, user_agent=None):
        """
        Initialize the Reddit API client with provided credentials
        
        Args:
            client_id (str): Reddit API client ID
            client_secret (str): Reddit API client secret
            user_agent (str): User agent string (optional)
            
        Returns:
            bool: True if client was initialized successfully, False otherwise
        """
        if not client_id or not client_secret:
            logger.error("Reddit API credentials missing")
            return False
            
        try:
            self.reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent or "PainPointScraper/1.0"
            )
            return True
        except Exception as e:
            logger.error(f"Error initializing Reddit client: {str(e)}")
            return False
        
    def search_reddit(self, query, subreddits=None, limit=100, time_filter="month"):
        """
        Search Reddit for posts containing specific keywords
        
        Args:
            query (str): The search query
            subreddits (list): List of subreddits to search
            limit (int): Maximum number of results to return
            time_filter (str): 'day', 'week', 'month', 'year', 'all'
            
        Returns:
            list: List of RedditPost objects
        """
        if not subreddits:
            subreddits = self.default_subreddits
            
        logger.info(f"Searching Reddit for '{query}' in {subreddits}")
        
        # Track which subreddits have been scraped
        for subreddit in subreddits:
            data_store.subreddits_scraped.add(subreddit)
            
        # Create subreddit objects
        subreddit_objects = [self.reddit.subreddit(sub) for sub in subreddits]
        
        # Use PRAW to search for posts
        posts = []
        for subreddit in subreddit_objects:
            try:
                for submission in subreddit.search(query, limit=limit, time_filter=time_filter):
                    # Convert to our internal model
                    post = RedditPost(
                        id=submission.id,
                        title=submission.title,
                        content=submission.selftext,
                        author=str(submission.author),
                        subreddit=str(submission.subreddit),
                        url=submission.url,
                        created_utc=datetime.fromtimestamp(submission.created_utc),
                        score=submission.score,
                        num_comments=submission.num_comments
                    )
                    posts.append(post)
                    
                    # Add to store
                    if post.id not in [p.id for p in data_store.raw_posts]:
                        data_store.raw_posts.append(post)
                        
                # Apply rate limiting to avoid hitting the Reddit API too hard
                time.sleep(2)
                    
            except Exception as e:
                logger.error(f"Error searching subreddit {subreddit}: {str(e)}")
                
        logger.info(f"Found {len(posts)} posts for query '{query}'")
        return posts
    
    def scrape_product_mentions(self, product_name, limit=100, subreddits=None, time_filter="month"):
        """
        Scrape mentions of a specific product
        
        Args:
            product_name (str): Name of the product to search for
            limit (int): Maximum number of posts to retrieve
            subreddits (list): List of subreddits to search (optional)
            time_filter (str): Time filter for search ('day', 'week', 'month', 'year', 'all')
            
        Returns:
            list: List of RedditPost objects
        """
        logger.info(f"Scraping mentions of {product_name} for time period: {self.time_filters.get(time_filter, 'unknown')}")
        
        # Use provided subreddits or default ones
        search_subreddits = subreddits if subreddits else self.default_subreddits
        logger.info(f"Searching in subreddits: {search_subreddits}")
        
        # Create search queries
        queries = [
            f"{product_name}",
            f"{product_name} issue",
            f"{product_name} problem",
            f"{product_name} bug",
            f"{product_name} feature request"
        ]
        
        all_posts = []
        for query in queries:
            posts = self.search_reddit(
                query=query, 
                subreddits=search_subreddits, 
                limit=limit//len(queries), 
                time_filter=time_filter
            )
            all_posts.extend(posts)
            
        # Update the timestamp for the last scrape
        data_store.last_scrape_time = datetime.now()
        
        return all_posts
    
    def scrape_all_products(self, limit=100, subreddits=None, time_filter="month", products=None):
        """
        Scrape mentions of all target products or specific products
        """
        data_store.scrape_in_progress = True  # Set to True at start
        try:
            result = {}
            # Use provided product list or default target products
            products_to_scrape = products if products else self.target_products
            
            for product in products_to_scrape:
                result[product] = self.scrape_product_mentions(
                    product_name=product, 
                    limit=limit, 
                    subreddits=subreddits, 
                    time_filter=time_filter
                )
                print("🚀 ~ result:", result)  # This print statement could be part of the issue
            data_store.scrape_in_progress = False  # Only set to False on success
            return result
        except Exception as e:
            logger.error(f"Error during scraping: {str(e)}")
            data_store.scrape_in_progress = False  # Also set to False on exception
            raise