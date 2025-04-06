# Define data models (for in-memory storage)

class RedditPost:
    """Model for storing Reddit post data"""
    def __init__(self, id, title, content, author, subreddit, url, created_utc, score, num_comments):
        self.id = id
        self.title = title
        self.content = content
        self.author = author
        self.subreddit = subreddit
        self.url = url
        self.created_utc = created_utc
        self.score = score
        self.num_comments = num_comments
        # Analysis results (to be filled later)
        self.sentiment = None
        self.topics = []
        self.pain_points = []
        self.severity = None

class PainPoint:
    """Model for categorized pain points"""
    def __init__(self, name, description, frequency=0, avg_sentiment=0, related_posts=None, product=None):
        self.name = name
        self.description = description
        self.frequency = frequency
        self.avg_sentiment = avg_sentiment
        self.related_posts = related_posts or []
        self.product = product  # e.g., "Cursor", "Replit"
        self.severity = 0  # Calculated based on frequency and sentiment
        
    def calculate_severity(self):
        """Calculate severity score based on frequency and sentiment"""
        # Negative sentiment is typically between -1 and 0
        # Convert to 0-1 scale and multiply by frequency
        sentiment_factor = abs(min(0, self.avg_sentiment))
        self.severity = self.frequency * sentiment_factor
        return self.severity
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "name": self.name,
            "description": self.description,
            "frequency": self.frequency,
            "avg_sentiment": self.avg_sentiment,
            "related_posts_count": len(self.related_posts),
            "product": self.product,
            "severity": self.severity
        }
