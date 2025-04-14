import logging
import json
import os
from flask import jsonify, request, Blueprint, current_app, make_response
from flask_restful import Resource
from datetime import datetime, timedelta
from threading import Thread

from dotenv import load_dotenv
from functools import wraps
import jwt
import bcrypt

# Import data_store from app
from app import data_store
from reddit_scraper import RedditScraper
from nlp_analyzer import NLPAnalyzer
from openai_analyzer import OpenAIAnalyzer
load_dotenv()
logger = logging.getLogger(__name__)

# Load environment variables
# Get API credentials from environment variables
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600))  # 1 hour default


# Initialize scraper and analyzers
scraper = RedditScraper()
analyzer = NLPAnalyzer()
openai_analyzer = OpenAIAnalyzer()
# In api_resources.py - no need to create a new MongoDB store here since we're using the one from app.py
mongodb_uri = os.getenv("MONGODB_URI")

# Initialize Reddit and OpenAI clients if credentials are available
if REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET:
    scraper.initialize_client(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET)
    
if OPENAI_API_KEY:
    openai_analyzer.initialize_client(OPENAI_API_KEY)


class Register(Resource):
    """API endpoint for user registration"""
    def post(self):
        """
        Register a new user
        
        POST parameters:
        - username (str): Username
        - password (str): Password
        - email (str): Email (optional)
        
        Returns:
            JSON response confirming registration
        """
        data = request.get_json() or {}
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        
        # Validate input
        if not username or not password:
            return {"status": "error", "message": "Username and password are required"}, 400
        
        # Check if username already exists in MongoDB
        if data_store.db is not None:
            # Check if user already exists
            existing_user = data_store.db.users.find_one({"username": username})
            if existing_user:
                return {"status": "error", "message": "Username already exists"}, 409
            
            # Hash password using bcrypt
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
            
            # Create user document
            user = {
                "username": username,
                "password": hashed_password.decode('utf-8'),  # Store as string
                "email": email,
                "created_at": datetime.utcnow(),
                "last_login": None
            }
            
            # Insert into database
            try:
                data_store.db.users.insert_one(user)
                return {"status": "success", "message": "User registered successfully"}, 201
            except Exception as e:
                logger.error(f"Error creating user: {str(e)}")
                return {"status": "error", "message": "Failed to create user"}, 500
        else:
            return {"status": "error", "message": "Database not available"}, 500

# JWT Authentication helper
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Try to get token from cookies first
        token = request.cookies.get('access_token')
        print("odjasiodjaosida")
        print(token)
        
        # If not in cookies, check Authorization header
        if not token:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return {"status": "error", "message": "Authentication token is missing"}, 401
        
        try:
            # Decode the token
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            current_user = payload
        except jwt.ExpiredSignatureError:
            return {"status": "error", "message": "Token has expired"}, 401
        except jwt.InvalidTokenError:
            return {"status": "error", "message": "Invalid token"}, 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated
class Login(Resource):
    """API endpoint for user authentication"""
    def post(self):
        """
        Authenticate user and return JWT token
        
        POST parameters:
        - username (str): Username
        - password (str): Password
        
        Returns:
            JSON response with JWT token
        """
        try:
            data = request.get_json() or {}
            username = data.get('username')
            password = data.get('password')
            
            # Validate input
            if not username or not password:
                return {"status": "error", "message": "Username and password are required"}, 400
            
            # Check MongoDB for user authentication
            if data_store.db is not None:
                user = data_store.db.users.find_one({"username": username})
                
                if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                    # Update last login time
                    data_store.db.users.update_one(
                        {"username": username},
                        {"$set": {"last_login": datetime.utcnow()}}
                    )
                    
                    # Generate JWT token
                    token_expiry = datetime.utcnow() + timedelta(seconds=JWT_ACCESS_TOKEN_EXPIRES)
                    token_payload = {
                        'username': username,
                        'exp': token_expiry
                    }
                    token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm="HS256")
                    
                    # Create response with token in cookie
                    response = make_response(jsonify({
                        "status": "success",
                        "message": "Authentication successful",
                        "token": token,
                        "expires": token_expiry.isoformat()
                    }))
                    
                    # Set secure cookie with token
                    response.set_cookie(
                        'access_token', 
                        token,
                        httponly=True,
                        secure=request.is_secure,  # True in production with HTTPS
                        samesite='Lax',  # Changed from 'Strict' to 'Lax' for better compatibility
                        max_age=JWT_ACCESS_TOKEN_EXPIRES
                    )
                    
                    return response
                else:
                    return {"status": "error", "message": "Invalid credentials"}, 401
            else:
                # Fallback to environment variable check if database not available
                if username == os.getenv("ADMIN_USERNAME", "admin") and password == os.getenv("ADMIN_PASSWORD", "password"):
                    # Generate JWT token
                    token_expiry = datetime.utcnow() + timedelta(seconds=JWT_ACCESS_TOKEN_EXPIRES)
                    token_payload = {
                        'username': username,
                        'exp': token_expiry
                    }
                    token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm="HS256")
                    
                    # Create response with token in cookie
                    response = make_response(jsonify({
                        "status": "success",
                        "message": "Authentication successful",
                        "token": token,
                        "expires": token_expiry.isoformat()
                    }))
                    
                    # Set secure cookie with token
                    response.set_cookie(
                        'access_token', 
                        token,
                        httponly=True,
                        secure=request.is_secure,  # True in production with HTTPS
                        samesite='Lax',  # Changed from 'Strict' to 'Lax'
                        max_age=JWT_ACCESS_TOKEN_EXPIRES
                    )
                    
                    return response
                else:
                    return {"status": "error", "message": "Invalid credentials"}, 401
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return {"status": "error", "message": f"Internal server error: {str(e)}"}, 500

class Logout(Resource):
    """API endpoint for user logout"""
    def post(self):
        """
        Logout user by clearing JWT cookie
        
        Returns:
            JSON response confirming logout
        """
        response = make_response(jsonify({
            "status": "success",
            "message": "Logout successful"
        }))
        
        # Clear the auth cookie
        response.set_cookie('access_token', '', expires=0)
        
        return response
class ScrapePosts(Resource):
    """API endpoint to trigger Reddit scraping"""
    @token_required
    def post(self, current_user):
        """
        Start a scraping job for Reddit posts
        
        POST parameters:
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
        
        # Validate Reddit credentials
        if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
            return {"status": "error", "message": "Reddit API credentials not configured on server"}, 500
            
        # Initialize Reddit client
        if not scraper.initialize_client(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET):
            return {"status": "error", "message": "Failed to initialize Reddit client"}, 500
            
        # Initialize OpenAI client if needed
        if use_openai:
            if not OPENAI_API_KEY:
                return {"status": "error", "message": "OpenAI API key not configured on server"}, 500
                
            if not openai_analyzer.initialize_client(OPENAI_API_KEY):
                return {"status": "error", "message": "Failed to initialize OpenAI client"}, 500
        
        # Validate time filter
        if time_filter not in scraper.time_filters.keys():
            return {"status": "error", "message": f"Invalid time_filter. Must be one of: {', '.join(scraper.time_filters.keys())}"}, 400
        
        
        # Update metadata in MongoDB -- need added
        data_store.update_metadata(
            scrape_in_progress=True,
            products=products,
            subreddits=subreddits if subreddits else scraper.default_subreddits,
            time_filter=time_filter
        )
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
                analyzer.analyze_posts(all_posts, products)
                
                # Save posts to MongoDB - UNCOMMENTED AND FIXED
                for post in all_posts:
                    # Set products for this post
                    post.products = analyzer.get_product_from_post(post, products)
                    # Save to MongoDB
                    data_store.save_post(post)
                
                logger.info(f"Saved {len(all_posts)} posts to MongoDB")
                
                # Process pain points - UNCOMMENTED AND FIXED
                pain_points = analyzer.categorize_pain_points(all_posts, products)
                for product, pain_point_list in pain_points.items():
                    for pain_point in pain_point_list:
                        data_store.save_pain_point(pain_point)
                
                logger.info(f"Saved pain points to MongoDB")
                
                # If OpenAI analysis is requested, analyze common pain points
                if use_openai and all_posts:
                    logger.info("Analyzing common pain points with OpenAI...")
                    
                    # Group posts by product
                    posts_by_product = {}
                    for post in all_posts:
                        matching_products = post.products
                        # A post can now match multiple products
                        for product in matching_products:
                            if product not in posts_by_product:
                                posts_by_product[product] = []
                            posts_by_product[product].append(post)
                    
                    # Analyze each product's posts
                    for product, product_posts in posts_by_product.items():
                        if len(product_posts) > 0:
                            analysis = openai_analyzer.analyze_common_pain_points(product_posts, product)
                            if 'error' not in analysis:
                                # Save analysis to MongoDB
                                data_store.save_openai_analysis(product, analysis)
                                logger.info(f"Stored OpenAI analysis for {product}")
                
                # Update metadata to indicate scrape is finished
                data_store.update_metadata(scrape_in_progress=False)
                
                logger.info(f"Completed scraping and analysis of {len(all_posts)} posts")
            except Exception as e:
                logger.error(f"Error in background scraping: {str(e)}")
                # Update status in case of error
                data_store.update_metadata(scrape_in_progress=False)
        
        # Start the background thread
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
class GetRecommendations(Resource):
    """API endpoint to get product recommendations based on pain points"""
    @token_required
    def get(self, current_user):
        """
        Get generated recommendations for addressing pain points
        
        GET parameters:
        - product (str): Single product name (optional, for backward compatibility)
        - products (str): Comma-separated list of product names (optional)
        - min_severity (float): Minimum severity of pain points to consider (optional)
        
        Returns:
            JSON response with recommendations data
        """
        # Get query parameters
        product = request.args.get('product')
        products_param = request.args.get('products')
        min_severity = request.args.get('min_severity', type=float, default=0)
        
        # Ensure OpenAI is initialized
        if not OPENAI_API_KEY:
            return {
                "status": "error",
                "message": "OpenAI API key not configured on server",
                "openai_enabled": False
            }, 500
            
        if not openai_analyzer.api_key:
            if not openai_analyzer.initialize_client(OPENAI_API_KEY):
                return {
                    "status": "error",
                    "message": "Failed to initialize OpenAI client",
                    "openai_enabled": False
                }, 500
        
        # Get all pain points from data store
        pain_points_dict = data_store.pain_points
        
        if not pain_points_dict:
            return {
                "status": "info",
                "message": "No pain points available. Use the scrape endpoint to collect data first.",
                "openai_enabled": True,
                "recommendations": []
            }
        
        # Store recommendations for each product
        all_recommendations = []
        
        # Parse multiple products
        if products_param:
            requested_products = [p.strip().lower() for p in products_param.split(',') if p.strip()]
            for prod in requested_products:
                # Get pain points for this product with minimum severity
                product_pain_points = [
                    p.to_dict() for p in pain_points_dict.values() 
                    if p.product.lower() == prod.lower() and p.severity >= min_severity
                ]
                
                if product_pain_points:
                    # Generate recommendations for this product
                    recommendations = openai_analyzer.generate_recommendations(product_pain_points, prod)
                    all_recommendations.append(recommendations)
                
            return {
                "status": "success",
                "openai_enabled": True,
                "recommendations": all_recommendations
            }
        
        # Single product (legacy support)
        if product:
            # Get pain points for this product with minimum severity
            product_pain_points = [
                p.to_dict() for p in pain_points_dict.values() 
                if p.product.lower() == product.lower() and p.severity >= min_severity
            ]
            
            if product_pain_points:
                # Generate recommendations for this product
                recommendations = openai_analyzer.generate_recommendations(product_pain_points, product)
                return {
                    "status": "success",
                    "openai_enabled": True,
                    "recommendations": [recommendations]
                }
            else:
                return {
                    "status": "success",
                    "openai_enabled": True,
                    "recommendations": []
                }
        
        # If no product specified, get unique products from pain points
        unique_products = set(p.product for p in pain_points_dict.values())
        
        # Generate recommendations for each product
        for prod in unique_products:
            # Get pain points for this product with minimum severity
            product_pain_points = [
                p.to_dict() for p in pain_points_dict.values() 
                if p.product == prod and p.severity >= min_severity
            ]
            
            if product_pain_points:
                # Generate recommendations for this product
                recommendations = openai_analyzer.generate_recommendations(product_pain_points, prod)
                all_recommendations.append(recommendations)
        
        return {
            "status": "success",
            "openai_enabled": True,
            "recommendations": all_recommendations
        }
    
class GetPainPoints(Resource):
    """API endpoint to get analyzed pain points"""
    @token_required
    def get(self, current_user):
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
    @token_required
    def get(self, current_user):
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
        
        # Check if MongoDB is connected
        if data_store.db is None:
            logger.error("MongoDB not connected, using in-memory data")
            # Fallback to in-memory data
            posts = data_store.analyzed_posts if data_store.analyzed_posts else data_store.raw_posts
        else:
            try:
                # Build MongoDB query
                query = {}
                
                if product:
                    query["products"] = product
                
                if has_pain_points:
                    query["pain_points"] = {"$exists": True, "$ne": []}
                    
                if subreddit:
                    query["subreddit"] = {"$regex": f"^{subreddit}$", "$options": "i"}
                    
                if min_score > 0:
                    query["score"] = {"$gte": min_score}
                    
                if min_comments > 0:
                    query["num_comments"] = {"$gte": min_comments}
                
                # Set up sorting
                mongo_sort_field = valid_sort_fields[sort_by]
                mongo_sort_direction = -1 if sort_order == 'desc' else 1
                
                # Query MongoDB
                cursor = data_store.db.posts.find(query).sort(mongo_sort_field, mongo_sort_direction)
                
                # Apply limit if specified
                if limit and limit > 0:
                    cursor = cursor.limit(limit)
                
                # Convert cursor to list
                posts = list(cursor)
                logger.info(f"Retrieved {len(posts)} posts from MongoDB")
                
            except Exception as e:
                logger.error(f"Error querying MongoDB: {str(e)}")
                # Fallback to in-memory data
                posts = data_store.analyzed_posts if data_store.analyzed_posts else data_store.raw_posts
                
                # Apply filters
                if product:
                    # Filter posts that mention the specified product
                    posts = [p for p in posts if hasattr(p, 'products') and product in p.products]
                
                if has_pain_points:
                    posts = [p for p in posts if hasattr(p, 'pain_points') and p.pain_points]
                    
                if subreddit:
                    posts = [p for p in posts if hasattr(p, 'subreddit') and p.subreddit.lower() == subreddit.lower()]
                    
                if min_score > 0:
                    posts = [p for p in posts if hasattr(p, 'score') and p.score >= min_score]
                    
                if min_comments > 0:
                    posts = [p for p in posts if hasattr(p, 'num_comments') and p.num_comments >= min_comments]
                
                # Sort by specified field
                sort_field = valid_sort_fields[sort_by]
                
                # For sentiment sorting, handle posts that don't have sentiment
                if sort_field == 'sentiment':
                    # Default sentiment to 0 if not available
                    posts.sort(key=lambda x: getattr(x, sort_field, 0) or 0, reverse=(sort_order == 'desc'))
                else:
                    posts.sort(key=lambda x: getattr(x, sort_field, 0), reverse=(sort_order == 'desc'))
                
                # Apply limit
                if limit and limit > 0:
                    posts = posts[:limit]
        
        # Convert to dictionaries for response
        result = []
        for post in posts:
            # Handle both MongoDB documents and custom objects
            if isinstance(post, dict):
                post_dict = {
                    "id": post.get("_id") or post.get("id"),
                    "title": post.get("title"),
                    "author": post.get("author"),
                    "subreddit": post.get("subreddit"),
                    "url": post.get("url"),
                    "created_utc": post.get("created_utc"),
                    "score": post.get("score"),
                    "num_comments": post.get("num_comments"),
                    "sentiment": post.get("sentiment"),
                    "topics": post.get("topics", []),
                    "pain_points": post.get("pain_points", []),
                    "products": post.get("products", [])
                }
            else:
                # Handle custom objects
                post_dict = {
                    "id": getattr(post, "id", None),
                    "title": getattr(post, "title", None),
                    "author": getattr(post, "author", None),
                    "subreddit": getattr(post, "subreddit", None),
                    "url": getattr(post, "url", None),
                    "created_utc": getattr(post, "created_utc", None),
                    "score": getattr(post, "score", None),
                    "num_comments": getattr(post, "num_comments", None),
                }
                
                # Add analysis results if available
                if hasattr(post, 'sentiment') and post.sentiment is not None:
                    post_dict["sentiment"] = post.sentiment
                
                if hasattr(post, 'topics') and post.topics:
                    post_dict["topics"] = post.topics
                    
                if hasattr(post, 'pain_points') and post.pain_points:
                    post_dict["pain_points"] = post.pain_points
                
                if hasattr(post, 'products') and post.products:
                    post_dict["products"] = post.products
            
            # Convert datetime objects to ISO format strings
            if isinstance(post_dict["created_utc"], datetime):
                post_dict["created_utc"] = post_dict["created_utc"].isoformat()
                
            result.append(post_dict)
        
        # Get last_updated timestamp
        last_updated = None
        if data_store.last_scrape_time:
            last_updated = data_store.last_scrape_time.isoformat() if isinstance(data_store.last_scrape_time, datetime) else data_store.last_scrape_time
        
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
            "last_updated": last_updated,
            "data_source": "mongodb" if data_store.db is not None else "memory"
        }
class GetStatus(Resource):
    """API endpoint to get current scraper status"""
    @token_required
    def get(self, current_user):
        """
        Get current status of the scraper
        
        Returns:
            JSON response with status information
        """
        # Get connection status from initialized clients
        reddit_status = "connected" if scraper.reddit else "not_configured"
        openai_status = "connected" if openai_analyzer.api_key else "not_configured"
                
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
    
class ResetScrapeStatus(Resource):
    """API endpoint to reset scraper status"""
    @token_required
    def post(self, current_user):
        """Reset the scrape_in_progress flag"""
        data_store.scrape_in_progress = False
        data_store.update_metadata(scrape_in_progress=False)
        return {
            "status": "success",
            "message": "Scrape status reset successfully"
        }

class GetOpenAIAnalysis(Resource):
    """API endpoint to get OpenAI analysis results"""
    @token_required
    def get(self, current_user):
        """
        Get the OpenAI analysis of pain points
        
        GET parameters:
        - product (str): Single product name (optional, for backward compatibility)
        - products (str): Comma-separated list of product names (optional)
        
        Returns:
            JSON response with OpenAI analysis data
        """
        # Get query parameters
        product = request.args.get('product')
        products_param = request.args.getlist('products[]')
        logger.info(f"Requested products: {products_param}")
        
        # Ensure OpenAI is initialized with server-side credentials
        if not OPENAI_API_KEY:
            return {
                "status": "error",
                "message": "OpenAI API key not configured on server",
                "openai_enabled": False
            }, 500
            
        if not openai_analyzer.api_key:
            if not openai_analyzer.initialize_client(OPENAI_API_KEY):
                return {
                    "status": "error",
                    "message": "Failed to initialize OpenAI client",
                    "openai_enabled": False
                }, 500
        
        # Check if MongoDB is connected
        if data_store.db is None:
            # Fallback to in-memory data
            if not data_store.openai_analyses:
                return {
                    "status": "info",
                    "message": "No OpenAI analyses available. Use the scrape endpoint with use_openai=true to generate analysis.",
                    "openai_enabled": True,
                    "analyses": []
                }
                
            # Parse multiple products from in-memory data
            matched_analyses = []
            if len(products_param) > 0:
                requested_products = [p.strip().lower() for p in products_param if p.strip()]
                for prod in requested_products:
                    for key in data_store.openai_analyses:
                        if key.lower() == prod.lower():
                            matched_analyses.append(data_store.openai_analyses[key])
                return {
                    "status": "success",
                    "openai_enabled": True,
                    "analyses": matched_analyses
                }

            # Single product (legacy support) from in-memory data
            if product:
                for key in data_store.openai_analyses:
                    if key.lower() == product.lower():
                        return {
                            "status": "success",
                            "openai_enabled": True,
                            "analyses": [data_store.openai_analyses[key]]
                        }
                return {
                    "status": "success",
                    "openai_enabled": True,
                    "analyses": []
                }

            # Return all analyses from in-memory data if no filters are applied
            return {
                "status": "success",
                "openai_enabled": True,
                "analyses": list(data_store.openai_analyses.values())
            }
        
        # Using MongoDB for data retrieval
        try:
            # Parse multiple products from MongoDB
            if len(products_param) > 0:
                requested_products = [p.strip().lower() for p in products_param if p.strip()]
                matched_analyses = []
                
                # Use MongoDB's $in operator to find matching products in one query
                query = {"_id": {"$in": requested_products}}
                cursor = data_store.db.openai_analysis.find(query)
                
                for doc in cursor:
                    # Transform to the expected response format
                    if "analysis" in doc:
                        matched_analyses.append(doc["analysis"])
                    else:
                        matched_analyses.append(doc)  # Include the entire document if no analysis field
                
                return {
                    "status": "success",
                    "openai_enabled": True,
                    "analyses": matched_analyses
                }
            
            # Single product (legacy support) from MongoDB
            if product:
                product_lower = product.lower()
                doc = data_store.db.openai_analysis.find_one({"_id": product_lower})
                
                if doc:
                    # Return the analysis field if it exists
                    if "analysis" in doc:
                        return {
                            "status": "success",
                            "openai_enabled": True,
                            "analyses": [doc["analysis"]]
                        }
                    # Otherwise return the whole document
                    return {
                        "status": "success",
                        "openai_enabled": True,
                        "analyses": [doc]
                    }
                
                return {
                    "status": "success",
                    "openai_enabled": True,
                    "analyses": []
                }
            
            # Return all analyses from MongoDB if no filters are applied
            all_analyses = []
            cursor = data_store.db.openai_analysis.find({})
            
            for doc in cursor:
                if "analysis" in doc:
                    all_analyses.append(doc["analysis"])
                else:
                    all_analyses.append(doc)
            
            return {
                "status": "success",
                "openai_enabled": True,
                "analyses": all_analyses
            }
            
        except Exception as e:
            logger.error(f"Error retrieving OpenAI analyses from MongoDB: {str(e)}")
            
            # Fallback to in-memory data if MongoDB query fails
            return {
                "status": "error",
                "message": f"Database error: {str(e)}",
                "openai_enabled": True,
                "analyses": list(data_store.openai_analyses.values())
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
    # Auth endpoints
    api.add_resource(Login, '/api/login')
    api.add_resource(Logout, '/api/logout')
    api.add_resource(Register, '/api/register')  # Add this line
    
    # Existing endpoints
    api.add_resource(ScrapePosts, '/api/scrape')
    api.add_resource(GetPainPoints, '/api/pain-points')
    api.add_resource(GetPosts, '/api/posts')
    api.add_resource(GetStatus, '/api/status')
    api.add_resource(GetOpenAIAnalysis, '/api/openai-analysis')
    api.add_resource(GetRecommendations, '/api/recommendations')
# Export the blueprint for registration
main_bp = routes_bp
