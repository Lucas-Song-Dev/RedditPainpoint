from app import db
from flask_login import UserMixin
from datetime import datetime


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    saved_searches = db.relationship('SavedSearch', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    
    # Relationships
    pain_points = db.relationship('PainPoint', backref='product', lazy=True)
    
    def __repr__(self):
        return f'<Product {self.name}>'


class PainPoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    frequency = db.Column(db.Integer, default=1)
    sentiment_score = db.Column(db.Float)
    date_identified = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    posts = db.relationship('RedditPost', backref='pain_point', lazy=True)
    
    def __repr__(self):
        return f'<PainPoint {self.title}>'


class RedditPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pain_point_id = db.Column(db.Integer, db.ForeignKey('pain_point.id'), nullable=False)
    reddit_id = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.String(300))
    url = db.Column(db.String(300))
    content = db.Column(db.Text)
    author = db.Column(db.String(100))
    subreddit = db.Column(db.String(100))
    created_utc = db.Column(db.DateTime)
    score = db.Column(db.Integer)
    
    def __repr__(self):
        return f'<RedditPost {self.reddit_id}>'


class SavedSearch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    keywords = db.Column(db.String(500))
    subreddits = db.Column(db.String(500))
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<SavedSearch {self.product_name}>'
