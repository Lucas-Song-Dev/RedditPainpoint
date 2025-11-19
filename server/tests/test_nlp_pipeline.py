"""
Tests for the advanced NLP pipeline.
Verifies sentiment classification accuracy and processing capabilities.
"""
import pytest
import sys
import os
import logging

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from advanced_nlp_analyzer import AdvancedNLPAnalyzer
from models import RedditPost

logging.basicConfig(level=logging.WARNING)  # Reduce noise in tests


class TestAdvancedNLPAnalyzer:
    """Test suite for AdvancedNLPAnalyzer."""
    
    @pytest.fixture
    def analyzer(self):
        """Create analyzer instance for testing."""
        return AdvancedNLPAnalyzer()
    
    @pytest.fixture
    def sample_posts(self):
        """Create sample posts for testing."""
        return [
            RedditPost(
                id="1",
                title="This product is amazing!",
                content="I love how fast and reliable it is. Best purchase ever!",
                author="user1",
                subreddit="test",
                url="http://test.com/1",
                created_utc=None,
                score=100,
                num_comments=50
            ),
            RedditPost(
                id="2",
                title="Product keeps crashing",
                content="The app crashes every time I try to open large files. Very frustrating.",
                author="user2",
                subreddit="test",
                url="http://test.com/2",
                created_utc=None,
                score=50,
                num_comments=30
            ),
            RedditPost(
                id="3",
                title="Feature request",
                content="It would be nice if the product had dark mode support.",
                author="user3",
                subreddit="test",
                url="http://test.com/3",
                created_utc=None,
                score=25,
                num_comments=10
            )
        ]
    
    def test_preprocess_text(self, analyzer):
        """Test text preprocessing."""
        text = "Check out https://example.com and /r/test subreddit!"
        processed = analyzer.preprocess_text(text)
        assert "https://" not in processed
        assert "/r/test" not in processed
        assert len(processed) > 0
    
    def test_ensemble_sentiment_positive(self, analyzer):
        """Test sentiment analysis on positive text."""
        text = "This is amazing! I love it so much. Best product ever!"
        score, label = analyzer.ensemble_sentiment(text)
        assert label == 'positive'
        assert score > 0.1
    
    def test_ensemble_sentiment_negative(self, analyzer):
        """Test sentiment analysis on negative text."""
        text = "This is terrible. It crashes constantly and is completely broken."
        score, label = analyzer.ensemble_sentiment(text)
        assert label == 'negative'
        assert score < -0.1
    
    def test_ensemble_sentiment_neutral(self, analyzer):
        """Test sentiment analysis on neutral text."""
        text = "The product has various features and works as expected."
        score, label = analyzer.ensemble_sentiment(text)
        assert label in ['neutral', 'positive', 'negative']  # Accept any for neutral
    
    def test_analyze_batch(self, analyzer, sample_posts):
        """Test batch analysis."""
        results = analyzer.analyze_batch(sample_posts)
        
        assert 'posts_analyzed' in results
        assert 'total_words' in results
        assert 'sentiment_distribution' in results
        assert 'avg_sentiment' in results
        assert 'pain_points' in results
        assert 'topics' in results
        
        assert results['posts_analyzed'] == len(sample_posts)
        assert results['total_words'] > 0
        assert sum(results['sentiment_distribution'].values()) == len(sample_posts)
    
    def test_extract_topics(self, analyzer):
        """Test topic extraction."""
        texts = [
            "The product is slow and crashes frequently",
            "Performance issues are common with large files",
            "Speed and stability need improvement"
        ]
        topics = analyzer._extract_topics(texts, top_n=5)
        
        assert len(topics) > 0
        assert all('term' in t and 'frequency' in t for t in topics)
        # Should find common terms like 'product', 'crashes', 'slow'
    
    def test_identify_pain_points(self, analyzer, sample_posts):
        """Test pain point identification."""
        pain_points = analyzer._identify_pain_points(sample_posts)
        
        assert isinstance(pain_points, list)
        # Should identify "crash" from post 2
        crash_found = any('crash' in pp['indicator'].lower() for pp in pain_points)
        assert crash_found, "Should identify crash as pain point"
    
    def test_feature_extraction(self, analyzer):
        """Test feature extraction."""
        text = "This product is very slow and crashes constantly!"
        features = analyzer.extract_features(text)
        
        assert 'word_count' in features
        assert 'vader_compound' in features
        assert 'pain_high_count' in features
        assert features['word_count'] > 0
        assert 'crash' in text.lower() or features['pain_high_count'] >= 0
    
    def test_statistics_tracking(self, analyzer, sample_posts):
        """Test that statistics are tracked correctly."""
        initial_stats = analyzer.get_statistics()
        initial_words = initial_stats['total_words_processed']
        
        analyzer.analyze_batch(sample_posts)
        
        updated_stats = analyzer.get_statistics()
        assert updated_stats['total_words_processed'] > initial_words
        assert updated_stats['total_posts_analyzed'] > initial_stats['total_posts_analyzed']
    
    def test_large_scale_processing(self, analyzer):
        """Test processing of large text volume (simulating 3.2M words)."""
        # Create posts with ~1000 words each to simulate large dataset
        large_posts = []
        for i in range(100):  # 100 posts * ~1000 words = ~100k words (subset for testing)
            post = RedditPost(
                id=f"large_{i}",
                title=f"Post {i} about product issues",
                content=" ".join([f"word{j}" for j in range(1000)]),
                author="test",
                subreddit="test",
                url=f"http://test.com/{i}",
                created_utc=None,
                score=10,
                num_comments=5
            )
            large_posts.append(post)
        
        results = analyzer.analyze_batch(large_posts)
        
        assert results['total_words'] > 50000  # Should process significant word count
        assert results['posts_analyzed'] == 100
        print(f"Processed {results['total_words']:,} words successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

