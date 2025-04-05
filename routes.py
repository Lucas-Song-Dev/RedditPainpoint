import json
import logging
from flask import jsonify, request, render_template
from models import db, Product, PainPoint, RedditPost
from reddit_scraper import RedditScraper
from analyzer import PainPointAnalyzer

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def register_routes(app):
    """Register all routes with the Flask app"""
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def index(path):
        """Serve the React app for all routes"""
        return render_template('index.html')
    
    @app.route('/api/products', methods=['GET'])
    def get_products():
        """Get all products"""
        try:
            products = Product.query.all()
            return jsonify({
                'success': True,
                'products': [{'id': p.id, 'name': p.name, 'description': p.description} for p in products]
            })
        except Exception as e:
            logger.error(f"Error getting products: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/products/<int:product_id>/pain-points', methods=['GET'])
    def get_product_pain_points(product_id):
        """Get pain points for a specific product"""
        try:
            pain_points = PainPoint.query.filter_by(product_id=product_id).all()
            return jsonify({
                'success': True,
                'pain_points': [
                    {
                        'id': pp.id,
                        'title': pp.title,
                        'description': pp.description,
                        'frequency': pp.frequency,
                        'date_identified': pp.date_identified.isoformat() if pp.date_identified else None
                    } for pp in pain_points
                ]
            })
        except Exception as e:
            logger.error(f"Error getting pain points for product {product_id}: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/pain-points/<int:pain_point_id>/posts', methods=['GET'])
    def get_pain_point_posts(pain_point_id):
        """Get Reddit posts for a specific pain point"""
        try:
            posts = RedditPost.query.filter_by(pain_point_id=pain_point_id).all()
            return jsonify({
                'success': True,
                'posts': [
                    {
                        'id': p.id,
                        'title': p.title,
                        'url': p.url,
                        'content': p.content,
                        'author': p.author,
                        'subreddit': p.subreddit,
                        'created_utc': p.created_utc.isoformat() if p.created_utc else None,
                        'score': p.score
                    } for p in posts
                ]
            })
        except Exception as e:
            logger.error(f"Error getting posts for pain point {pain_point_id}: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/stats', methods=['GET'])
    def get_stats():
        """Get pain point statistics across all products"""
        try:
            analyzer = PainPointAnalyzer()
            product_id = request.args.get('product_id', type=int)
            stats = analyzer.get_pain_point_stats(product_id)
            
            return jsonify({
                'success': True,
                'stats': stats
            })
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/scrape', methods=['POST'])
    def scrape_reddit():
        """Scrape Reddit for a product"""
        try:
            data = request.json
            product_name = data.get('product_name')
            subreddits = data.get('subreddits', [])
            
            if not product_name:
                return jsonify({
                    'success': False,
                    'error': 'Product name is required'
                }), 400
            
            # Check if product exists
            product = Product.query.filter_by(name=product_name).first()
            if not product:
                # Create new product
                product = Product(name=product_name)
                db.session.add(product)
                db.session.commit()
            
            # Initialize scraper and analyzer
            scraper = RedditScraper()
            analyzer = PainPointAnalyzer()
            
            # Scrape Reddit posts
            posts = scraper.search_product_issues(product_name, subreddits)
            
            if not posts:
                return jsonify({
                    'success': False,
                    'error': 'No posts found for the given product and subreddits'
                }), 404
            
            # Identify pain points
            pain_points = analyzer.identify_pain_points(posts)
            
            # Save pain points to database
            analyzer.save_pain_points_to_db(pain_points, product_name)
            
            # Save posts to database
            for pain_point in pain_points:
                related_posts = [post for post in posts if post['reddit_id'] in pain_point['related_posts']]
                pain_point_obj = PainPoint.query.filter_by(
                    product_id=product.id,
                    title=pain_point['keyword'].capitalize()
                ).first()
                
                if pain_point_obj and related_posts:
                    scraper.save_posts_to_db(related_posts, pain_point_obj.id)
            
            return jsonify({
                'success': True,
                'message': f"Successfully scraped and analyzed data for {product_name}",
                'post_count': len(posts),
                'pain_point_count': len(pain_points)
            })
            
        except Exception as e:
            logger.error(f"Error scraping Reddit: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/init', methods=['POST'])
    def initialize_data():
        """Initialize default products and sample data"""
        try:
            scraper = RedditScraper()
            scraper.initialize_default_products()
            
            return jsonify({
                'success': True,
                'message': "Successfully initialized default products"
            })
        except Exception as e:
            logger.error(f"Error initializing data: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    logger.debug("Routes registered successfully")
