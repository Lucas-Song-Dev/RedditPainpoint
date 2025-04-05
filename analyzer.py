import re
import logging
from collections import Counter
import pandas as pd
from models import PainPoint, RedditPost, Product, db

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class PainPointAnalyzer:
    def __init__(self):
        # Common issue-related phrases to look for
        self.issue_phrases = [
            "doesn't work", "does not work", "broken", "bug", "issue", "problem",
            "frustrating", "annoying", "can't", "cannot", "impossible",
            "should be able to", "need to be able to", "wish", "missing",
            "feature request", "please add", "would be great if",
            "doesn't support", "does not support", "failed", "error",
            "crash", "slow", "lag", "usability", "confusing", "difficult"
        ]
        
        # Common stop words to filter out
        self.stop_words = set([
            "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
            "when", "where", "how", "why", "who", "which", "this", "that", "these",
            "those", "is", "are", "was", "were", "be", "been", "being", "have", "has",
            "had", "do", "does", "did", "doing", "can", "could", "should", "would",
            "will", "shall", "may", "might", "must", "for", "of", "with", "about",
            "against", "between", "into", "through", "during", "before", "after",
            "above", "below", "to", "from", "up", "down", "in", "out", "on", "off",
            "over", "under", "again", "further", "then", "once", "here", "there",
            "all", "any", "both", "each", "few", "more", "most", "other", "some",
            "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
            "very", "just", "don't", "doesn't", "didn't", "can't", "cannot", "couldn't",
            "shouldn't", "wouldn't", "won't", "very", "really"
        ])

    def preprocess_text(self, text):
        """
        Preprocess text for analysis by removing special characters and converting to lowercase
        """
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+', '', text)
        
        # Remove special characters and digits
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\d+', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def extract_keywords(self, text, max_keywords=5):
        """
        Extract keywords from text by finding common words that aren't stop words
        """
        if not text:
            return []
        
        # Preprocess the text
        processed_text = self.preprocess_text(text)
        
        # Split into words
        words = processed_text.split()
        
        # Filter out stop words
        filtered_words = [word for word in words if word not in self.stop_words and len(word) > 2]
        
        # Count word frequencies
        word_counts = Counter(filtered_words)
        
        # Get the top keywords
        keywords = [word for word, count in word_counts.most_common(max_keywords)]
        
        return keywords

    def identify_pain_points(self, posts):
        """
        Identify common pain points from a list of Reddit posts
        """
        if not posts:
            logger.warning("No posts provided for pain point analysis")
            return []
        
        # Prepare data for analysis
        processed_posts = []
        for post in posts:
            combined_text = f"{post['title']} {post['content']}"
            processed_text = self.preprocess_text(combined_text)
            processed_posts.append({
                'reddit_id': post['reddit_id'],
                'text': processed_text,
                'keywords': self.extract_keywords(processed_text),
                'product_name': post['product_name']
            })
        
        # Create a DataFrame for easier analysis
        df = pd.DataFrame(processed_posts)
        
        # Find posts containing issue phrases
        def contains_issue(text):
            return any(phrase in text for phrase in self.issue_phrases)
        
        df['is_issue'] = df['text'].apply(contains_issue)
        issue_posts = df[df['is_issue']]
        
        if issue_posts.empty:
            logger.warning("No pain points identified in the provided posts")
            return []
        
        # Group similar issues based on keywords
        all_keywords = []
        for keywords in issue_posts['keywords']:
            all_keywords.extend(keywords)
        
        # Find the most common keywords across issue posts
        common_keywords = Counter(all_keywords).most_common(10)
        
        # Group posts by their primary keyword
        pain_points = []
        for keyword, _ in common_keywords:
            related_posts = []
            for _, post in issue_posts.iterrows():
                if keyword in post['keywords']:
                    related_posts.append(post['reddit_id'])
            
            if related_posts:
                pain_points.append({
                    'keyword': keyword,
                    'related_posts': related_posts,
                    'frequency': len(related_posts),
                    'product_name': posts[0]['product_name']  # Assuming all posts are for the same product
                })
        
        logger.debug(f"Identified {len(pain_points)} pain points")
        return pain_points

    def save_pain_points_to_db(self, pain_points, product_name):
        """
        Save identified pain points to the database
        """
        try:
            # Get the product ID
            product = Product.query.filter_by(name=product_name).first()
            if not product:
                logger.error(f"Product '{product_name}' not found in database")
                return
            
            for pain_point_data in pain_points:
                # Check if a similar pain point already exists
                existing_pain_point = PainPoint.query.filter_by(
                    product_id=product.id,
                    title=pain_point_data['keyword'].capitalize()
                ).first()
                
                if existing_pain_point:
                    # Update frequency if it already exists
                    existing_pain_point.frequency += pain_point_data['frequency']
                    logger.debug(f"Updated existing pain point: {existing_pain_point.title}")
                else:
                    # Create a new pain point
                    new_pain_point = PainPoint(
                        product_id=product.id,
                        title=pain_point_data['keyword'].capitalize(),
                        description=f"Issues related to {pain_point_data['keyword']}",
                        frequency=pain_point_data['frequency']
                    )
                    db.session.add(new_pain_point)
                    db.session.flush()  # To get the ID
                    
                    logger.debug(f"Created new pain point: {new_pain_point.title}")
                    
                    # Link Reddit posts to this pain point
                    for reddit_id in pain_point_data['related_posts']:
                        post = RedditPost.query.filter_by(reddit_id=reddit_id).first()
                        if post:
                            post.pain_point_id = new_pain_point.id
            
            db.session.commit()
            logger.debug(f"Successfully saved pain points for product '{product_name}'")
            
        except Exception as e:
            logger.error(f"Error saving pain points to database: {e}")
            db.session.rollback()
    
    def get_pain_point_stats(self, product_id=None):
        """
        Get statistics about pain points, optionally filtered by product
        """
        try:
            query = db.session.query(
                Product.name.label('product_name'),
                PainPoint.title.label('pain_point'),
                PainPoint.frequency.label('frequency'),
                db.func.count(RedditPost.id).label('post_count')
            ).join(
                PainPoint, Product.id == PainPoint.product_id
            ).outerjoin(
                RedditPost, PainPoint.id == RedditPost.pain_point_id
            ).group_by(
                Product.name, PainPoint.title, PainPoint.frequency
            )
            
            if product_id:
                query = query.filter(Product.id == product_id)
            
            results = query.all()
            
            # Convert to a list of dictionaries
            stats = []
            for row in results:
                stats.append({
                    'product_name': row.product_name,
                    'pain_point': row.pain_point,
                    'frequency': row.frequency,
                    'post_count': row.post_count
                })
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting pain point stats: {e}")
            return []
