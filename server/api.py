import logging
import json
from flask import jsonify, request, Blueprint, current_app
from flask_restful import Resource
from datetime import datetime
from threading import Thread

from app import data_store
from reddit_scraper import RedditScraper
from nlp_analyzer import NLPAnalyzer
from openai_analyzer import OpenAIAnalyzer

logger = logging.getLogger(__name__)

# Initialize scraper and analyzers
scraper = RedditScraper()
analyzer = NLPAnalyzer()
openai_analyzer = OpenAIAnalyzer()

# API endpoints as Resources
class ScrapePosts(Resource):
    """API endpoint to trigger Reddit scraping"""
    def post(self):
        """
        Start a scraping job for Reddit posts
        
        POST parameters:
        - reddit_client_id (str): Reddit API client ID
        - reddit_client_secret (str): Reddit API client secret
        - openai_api_key (str): OpenAI API key (required if use_openai=True)
        - products (list): List of product names to scrape (optional)
        - limit (int): Maximum number of posts to scrape per product (optional)
        - subreddits (list): List of subreddits to search (optional)
        - time_filter (str): Time period to search ('day', 'week', 'month', 'year', 'all') (optional)
        - use_openai (bool): Whether to use OpenAI to analyze common pain points (optional)
        
        Returns:
            JSON response with status of the scraping job
        """
        if data_store.scrape_in_progress:
            return {"status": "error", "message": "A scraping job is already in progress"}, 409
        
        # Get parameters
        data = request.get_json() or {}
        products = data.get('products', scraper.target_products)
        limit = int(data.get('limit', 100))
        subreddits = data.get('subreddits')
        time_filter = data.get('time_filter', 'month')
        use_openai = data.get('use_openai', False)
        
        # Get authentication credentials
        reddit_client_id = data.get('reddit_client_id')
        reddit_client_secret = data.get('reddit_client_secret')
        openai_api_key = data.get('openai_api_key')
        
        # Validate Reddit credentials
        if not reddit_client_id or not reddit_client_secret:
            return {"status": "error", "message": "Reddit API credentials required"}, 400
            
        # Initialize Reddit client
        if not scraper.initialize_client(reddit_client_id, reddit_client_secret):
            return {"status": "error", "message": "Failed to initialize Reddit client"}, 400
            
        # Initialize OpenAI client if needed
        if use_openai:
            if not openai_api_key:
                return {"status": "error", "message": "OpenAI API key required when use_openai=True"}, 400
                
            if not openai_analyzer.initialize_client(openai_api_key):
                return {"status": "error", "message": "Failed to initialize OpenAI client"}, 400
        
        # Validate time filter
        if time_filter not in scraper.time_filters.keys():
            return {"status": "error", "message": f"Invalid time_filter. Must be one of: {', '.join(scraper.time_filters.keys())}"}, 400
        
        # Start scraping in a background thread
        def background_scrape():
            try:
                # Scrape posts
                logger.info(f"Starting scraping for products: {products}, time_filter: {time_filter}")
                all_posts = []
                
                # Use the updated scraper method with filters
                result = scraper.scrape_all_products(
                    limit=limit,
                    subreddits=subreddits,
                    time_filter=time_filter,
                    products=products
                )
                
                # Flatten the results
                for product_posts in result.values():
                    all_posts.extend(product_posts)
                
                # Analyze posts with NLP
                analyzer.analyze_posts(all_posts)
                
                # If OpenAI analysis is requested, analyze common pain points
                if use_openai and all_posts:
                    logger.info("Analyzing common pain points with OpenAI...")
                    
                    # Group posts by product
                    posts_by_product = {}
                    for post in all_posts:
                        product = analyzer.get_product_from_post(post)
                        if product:
                            if product not in posts_by_product:
                                posts_by_product[product] = []
                            posts_by_product[product].append(post)
                    
                    # Analyze each product's posts
                    for product, product_posts in posts_by_product.items():
                        if len(product_posts) > 0:
                            analysis = openai_analyzer.analyze_common_pain_points(product_posts, product)
                            if 'error' not in analysis:
                                data_store.openai_analyses[product] = analysis
                                logger.info(f"Stored OpenAI analysis for {product}")
                
                # Update timestamp
                data_store.last_scrape_time = datetime.now()
                data_store.scrape_in_progress = False
                
                logger.info(f"Completed scraping and analysis of {len(all_posts)} posts")
            except Exception as e:
                logger.error(f"Error in background scraping: {str(e)}")
                data_store.scrape_in_progress = False
        
        # Start the background thread
        data_store.scrape_in_progress = True
        scrape_thread = Thread(target=background_scrape)
        scrape_thread.daemon = True
        scrape_thread.start()
        
        return {
            "status": "success", 
            "message": "Scraping job started", 
            "products": products, 
            "limit": limit,
            "subreddits": subreddits if subreddits else scraper.default_subreddits,
            "time_filter": time_filter,
            "use_openai": use_openai
        }

class GetPainPoints(Resource):
    """API endpoint to get analyzed pain points"""
    def get(self):
        """
        Get all identified pain points
        
        GET parameters:
        - product (str): Filter by product name (optional)
        - limit (int): Limit number of results (optional)
        - min_severity (float): Minimum severity score (optional)
        
        Returns:
            JSON response with pain points data
        """
        # Get parameters
        product = request.args.get('product')
        limit = request.args.get('limit', type=int)
        min_severity = request.args.get('min_severity', type=float, default=0)
        
        # Get all pain points
        pain_points = list(data_store.pain_points.values())
        
        # Apply filters
        if product:
            pain_points = [p for p in pain_points if p.product and p.product.lower() == product.lower()]
        
        if min_severity > 0:
            pain_points = [p for p in pain_points if p.severity >= min_severity]
        
        # Sort by severity
        pain_points.sort(key=lambda x: x.severity, reverse=True)
        
        # Apply limit
        if limit and limit > 0:
            pain_points = pain_points[:limit]
        
        # Convert to dictionaries
        result = [p.to_dict() for p in pain_points]
        
        return {
            "status": "success",
            "count": len(result),
            "pain_points": result,
            "last_updated": data_store.last_scrape_time.isoformat() if data_store.last_scrape_time else None
        }

class GetPosts(Resource):
    """API endpoint to get scraped posts"""
    def get(self):
        """
        Get all scraped posts
        
        GET parameters:
        - product (str): Filter by product name (optional)
        - limit (int): Limit number of results (optional)
        - has_pain_points (bool): Only return posts with identified pain points (optional)
        - subreddit (str): Filter by subreddit name (optional)
        - min_score (int): Minimum score threshold (optional)
        - min_comments (int): Minimum comments threshold (optional)
        - sort_by (str): Field to sort by ('date', 'score', 'comments', 'sentiment') (optional, default: 'date')
        - sort_order (str): Sort order ('asc' or 'desc') (optional, default: 'desc')
        
        Returns:
            JSON response with posts data
        """
        # Get parameters
        product = request.args.get('product')
        limit = request.args.get('limit', type=int)
        has_pain_points = request.args.get('has_pain_points', type=bool, default=False)
        subreddit = request.args.get('subreddit')
        min_score = request.args.get('min_score', type=int, default=0)
        min_comments = request.args.get('min_comments', type=int, default=0)
        sort_by = request.args.get('sort_by', default='date')
        sort_order = request.args.get('sort_order', default='desc')
        
        # Validate sort parameters
        valid_sort_fields = {'date': 'created_utc', 'score': 'score', 'comments': 'num_comments', 'sentiment': 'sentiment'}
        if sort_by not in valid_sort_fields:
            return {"status": "error", "message": f"Invalid sort_by parameter. Must be one of: {', '.join(valid_sort_fields.keys())}"}, 400
        
        if sort_order not in ['asc', 'desc']:
            return {"status": "error", "message": "Invalid sort_order parameter. Must be 'asc' or 'desc'"}, 400
        
        # Get all posts
        posts = data_store.analyzed_posts if data_store.analyzed_posts else data_store.raw_posts
        
        # Apply filters
        if product:
            posts = [p for p in posts if analyzer.get_product_from_post(p) == product]
        
        if has_pain_points:
            posts = [p for p in posts if hasattr(p, 'pain_points') and p.pain_points]
            
        if subreddit:
            posts = [p for p in posts if p.subreddit.lower() == subreddit.lower()]
            
        if min_score > 0:
            posts = [p for p in posts if p.score >= min_score]
            
        if min_comments > 0:
            posts = [p for p in posts if p.num_comments >= min_comments]
        
        # Sort by specified field
        sort_field = valid_sort_fields[sort_by]
        
        # For sentiment sorting, handle posts that don't have sentiment
        if sort_field == 'sentiment':
            # Default sentiment to 0 if not available
            posts.sort(key=lambda x: getattr(x, sort_field, 0) or 0, reverse=(sort_order == 'desc'))
        else:
            posts.sort(key=lambda x: getattr(x, sort_field), reverse=(sort_order == 'desc'))
        
        # Apply limit
        if limit and limit > 0:
            posts = posts[:limit]
        
        # Convert to dictionaries
        result = []
        for post in posts:
            post_dict = {
                "id": post.id,
                "title": post.title,
                "author": post.author,
                "subreddit": post.subreddit,
                "url": post.url,
                "created_utc": post.created_utc.isoformat(),
                "score": post.score,
                "num_comments": post.num_comments,
            }
            
            # Add analysis results if available
            if hasattr(post, 'sentiment') and post.sentiment is not None:
                post_dict["sentiment"] = post.sentiment
            
            if hasattr(post, 'topics') and post.topics:
                post_dict["topics"] = post.topics
                
            if hasattr(post, 'pain_points') and post.pain_points:
                post_dict["pain_points"] = post.pain_points
                
            result.append(post_dict)
        
        return {
            "status": "success",
            "count": len(result),
            "posts": result,
            "filters_applied": {
                "product": product,
                "has_pain_points": has_pain_points,
                "subreddit": subreddit,
                "min_score": min_score,
                "min_comments": min_comments
            },
            "sort": {
                "field": sort_by,
                "order": sort_order
            },
            "last_updated": data_store.last_scrape_time.isoformat() if data_store.last_scrape_time else None
        }

class GetStatus(Resource):
    """API endpoint to get current scraper status"""
    def get(self):
        """
        Get current status of the scraper
        
        GET parameters:
        - reddit_client_id (str): Reddit API client ID (optional, for testing connection)
        - reddit_client_secret (str): Reddit API client secret (optional, for testing connection)
        - openai_api_key (str): OpenAI API key (optional, for testing connection)
        
        Returns:
            JSON response with status information
        """
        # Get API keys from query params or headers for testing
        reddit_client_id = request.args.get('reddit_client_id') or request.headers.get('X-Reddit-Client-ID')
        reddit_client_secret = request.args.get('reddit_client_secret') or request.headers.get('X-Reddit-Client-Secret')
        openai_api_key = request.args.get('openai_api_key') or request.headers.get('X-OpenAI-API-Key')
        
        # Test connections if credentials provided
        reddit_status = "not_configured"
        openai_status = "not_configured"
        
        if reddit_client_id and reddit_client_secret:
            if scraper.initialize_client(reddit_client_id, reddit_client_secret):
                reddit_status = "connected"
            else:
                reddit_status = "error"
                
        if openai_api_key:
            if openai_analyzer.initialize_client(openai_api_key):
                openai_status = "connected"
            else:
                openai_status = "error"
                
        return {
            "status": "success",
            "scrape_in_progress": data_store.scrape_in_progress,
            "last_scrape_time": data_store.last_scrape_time.isoformat() if data_store.last_scrape_time else None,
            "raw_posts_count": len(data_store.raw_posts),
            "analyzed_posts_count": len(data_store.analyzed_posts),
            "pain_points_count": len(data_store.pain_points),
            "subreddits_scraped": list(data_store.subreddits_scraped),
            "has_openai_analyses": len(data_store.openai_analyses) > 0,
            "openai_analyses_count": len(data_store.openai_analyses),
            "apis": {
                "reddit": reddit_status,
                "openai": openai_status
            }
        }

class GetOpenAIAnalysis(Resource):
    """API endpoint to get OpenAI analysis results"""
    def get(self):
        """
        Get the OpenAI analysis of pain points
        
        GET parameters:
        - product (str): Filter by product name (optional)
        - openai_api_key (str): OpenAI API key (optional, can be provided in header instead)
        
        Returns:
            JSON response with OpenAI analysis data
        """
        # Get parameters
        product = request.args.get('product')
        
        # Get API key from query params or headers
        api_key = request.args.get('openai_api_key') or request.headers.get('X-OpenAI-API-Key')
        
        # Initialize OpenAI if API key provided
        if api_key and not openai_analyzer.api_key:
            openai_analyzer.initialize_client(api_key)
        
        if not openai_analyzer.api_key:
            return {
                "status": "error",
                "message": "OpenAI API key required. Provide it as a query parameter or in the X-OpenAI-API-Key header.",
                "openai_enabled": False
            }, 400
        
        # If no analyses available
        if not data_store.openai_analyses:
            return {
                "status": "info",
                "message": "No OpenAI analyses available. Use the scrape endpoint with use_openai=true to generate analysis.",
                "openai_enabled": True,
                "analyses": []
            }
            
        # If product is specified, return only that product's analysis
        if product and product in data_store.openai_analyses:
            return {
                "status": "success",
                "openai_enabled": True,
                "analyses": [data_store.openai_analyses[product]]
            }
        
        # Return all analyses
        return {
            "status": "success",
            "openai_enabled": True,
            "analyses": list(data_store.openai_analyses.values())
        }
    

class UpdateCredentials(Resource):
    """API endpoint to update API credentials"""
    def post(self):
        """
        Update API credentials
        
        POST parameters:
        - reddit_client_id (str): Reddit API client ID (optional)
        - reddit_client_secret (str): Reddit API client secret (optional)
        - openai_api_key (str): OpenAI API key (optional)
        
        Returns:
            JSON response with status of the credential update
        """
        # Get parameters from JSON body
        data = request.get_json() or {}
        reddit_client_id = data.get('reddit_client_id')
        reddit_client_secret = data.get('reddit_client_secret')
        openai_api_key = data.get('openai_api_key')
        
        # Update Reddit credentials if provided
        if reddit_client_id and reddit_client_secret:
            # Test if the credentials are valid
            if scraper.initialize_client(reddit_client_id, reddit_client_secret):
                logger.info("Reddit credentials updated successfully")
            else:
                return {
                    "status": "error",
                    "message": "Invalid Reddit credentials provided"
                }, 400
        
        # Update OpenAI credentials if provided
        if openai_api_key:
            # Test if the credentials are valid
            if openai_analyzer.initialize_client(openai_api_key):
                logger.info("OpenAI credentials updated successfully")
            else:
                return {
                    "status": "error",
                    "message": "Invalid OpenAI API key provided"
                }, 400
        
        # Return success response with API status
        return {
            "status": "success",
            "message": "Credentials updated successfully",
            "apis": {
                "reddit": "connected" if scraper.reddit else "not_connected",
                "openai": "connected" if openai_analyzer.api_key else "not_connected"
            }
        }

# Create routes blueprint
routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/')
def index():
    """Render the admin dashboard"""
    from flask import render_template
    return render_template('index.html')

def initialize_routes(api):
    """Add all resources to the API"""
    api.add_resource(ScrapePosts, '/api/scrape')
    api.add_resource(GetPainPoints, '/api/pain-points')
    api.add_resource(GetPosts, '/api/posts')
    api.add_resource(GetStatus, '/api/status')
    api.add_resource(GetOpenAIAnalysis, '/api/openai-analysis')
    api.add_resource(UpdateCredentials, '/api/credentials')

# Export the blueprint for registration
main_bp = routes_bp
