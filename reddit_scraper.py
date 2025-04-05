import os
import praw
import logging
from datetime import datetime
from models import RedditPost, Product, db

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class RedditScraper:
    def __init__(self):
        # Initialize Reddit API client
        try:
            self.reddit = praw.Reddit(
                client_id=os.environ.get('REDDIT_CLIENT_ID', ''),
                client_secret=os.environ.get('REDDIT_CLIENT_SECRET', ''),
                user_agent=os.environ.get('REDDIT_USER_AGENT', 'script:painpoint-scraper:v1.0 (by /u/yourusername)')
            )
            logger.debug("Reddit API client initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing Reddit API client: {e}")
            self.reddit = None

    def is_initialized(self):
        """Check if the Reddit API client is properly initialized"""
        return self.reddit is not None

    def search_product_issues(self, product_name, subreddits=None, limit=100, time_filter='month'):
        """
        Search Reddit for posts about issues related to a specific product
        
        Args:
            product_name (str): Name of the product to search for
            subreddits (list): List of subreddit names to search in
            limit (int): Maximum number of posts to retrieve
            time_filter (str): Time filter for the search ('day', 'week', 'month', 'year', 'all')
            
        Returns:
            list: List of posts found
        """
        if not self.is_initialized():
            logger.error("Reddit API client not initialized. Cannot perform search.")
            return []
        
        posts = []
        search_query = f"{product_name} (issue OR problem OR bug OR frustrating OR broken)"
        
        try:
            # If subreddits are specified, search in those subreddits
            if subreddits:
                for subreddit_name in subreddits:
                    subreddit = self.reddit.subreddit(subreddit_name)
                    search_results = subreddit.search(search_query, sort='relevance', time_filter=time_filter, limit=limit)
                    for post in search_results:
                        posts.append(self._convert_post_to_dict(post, product_name))
            # Otherwise, search across all of Reddit
            else:
                search_results = self.reddit.subreddit('all').search(search_query, sort='relevance', time_filter=time_filter, limit=limit)
                for post in search_results:
                    posts.append(self._convert_post_to_dict(post, product_name))
            
            logger.debug(f"Found {len(posts)} posts for product '{product_name}'")
            return posts
        
        except Exception as e:
            logger.error(f"Error searching Reddit for '{product_name}': {e}")
            return []

    def _convert_post_to_dict(self, post, product_name):
        """Convert a PRAW post object to a dictionary"""
        created_datetime = datetime.fromtimestamp(post.created_utc)
        
        return {
            'reddit_id': post.id,
            'title': post.title,
            'url': f"https://www.reddit.com{post.permalink}",
            'content': post.selftext,
            'author': str(post.author) if post.author else '[deleted]',
            'subreddit': post.subreddit.display_name,
            'created_utc': created_datetime,
            'score': post.score,
            'product_name': product_name
        }

    def save_posts_to_db(self, posts, pain_point_id):
        """Save Reddit posts to the database"""
        for post_data in posts:
            try:
                # Check if post already exists
                existing_post = RedditPost.query.filter_by(reddit_id=post_data['reddit_id']).first()
                if existing_post:
                    logger.debug(f"Post {post_data['reddit_id']} already exists in database")
                    continue
                
                # Create new post
                new_post = RedditPost(
                    pain_point_id=pain_point_id,
                    reddit_id=post_data['reddit_id'],
                    title=post_data['title'],
                    url=post_data['url'],
                    content=post_data['content'],
                    author=post_data['author'],
                    subreddit=post_data['subreddit'],
                    created_utc=post_data['created_utc'],
                    score=post_data['score']
                )
                db.session.add(new_post)
                
            except Exception as e:
                logger.error(f"Error saving post {post_data.get('reddit_id')}: {e}")
                db.session.rollback()
        
        try:
            db.session.commit()
            logger.debug(f"Successfully saved {len(posts)} posts to database")
        except Exception as e:
            logger.error(f"Error committing posts to database: {e}")
            db.session.rollback()

    def get_default_products(self):
        """Return a list of default products to scrape"""
        return [
            {"name": "Cursor", "description": "AI-powered code editor"},
            {"name": "Replit", "description": "Online IDE and coding platform"},
            {"name": "VSCode", "description": "Microsoft's code editor"},
            {"name": "GitHub Copilot", "description": "AI pair programming tool"}
        ]

    def initialize_default_products(self):
        """Initialize default products in the database if they don't exist"""
        default_products = self.get_default_products()
        
        for product_data in default_products:
            try:
                existing_product = Product.query.filter_by(name=product_data['name']).first()
                if not existing_product:
                    new_product = Product(
                        name=product_data['name'],
                        description=product_data['description']
                    )
                    db.session.add(new_product)
                    logger.debug(f"Added default product: {product_data['name']}")
            except Exception as e:
                logger.error(f"Error adding default product {product_data['name']}: {e}")
                db.session.rollback()
        
        try:
            db.session.commit()
            logger.debug("Successfully initialized default products")
        except Exception as e:
            logger.error(f"Error committing default products to database: {e}")
            db.session.rollback()
