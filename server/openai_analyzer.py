import json
import logging
from openai import OpenAI
from datetime import datetime

logger = logging.getLogger(__name__)

class OpenAIAnalyzer:
    """
    Uses OpenAI's API to analyze Reddit posts and identify common pain points.
    """
    
    def __init__(self):
        """Initialize the OpenAI analyzer without the client"""
        self.client = None
        self.api_key = None
        logger.warning("OpenAI client not initialized. API key must be provided with each request.")
            
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # do not change this unless explicitly requested by the user
        self.model = "gpt-4o-mini"
        
    def initialize_client(self, api_key):
        """
        Initialize the OpenAI client with the provided API key
        
        Args:
            api_key (str): OpenAI API key
            
        Returns:
            bool: True if client was initialized successfully, False otherwise
        """
        if not api_key:
            logger.error("No API key provided to initialize OpenAI client")
            return False
            
        try:
            self.client = OpenAI(api_key=api_key)
            self.api_key = api_key
            return True
        except Exception as e:
            logger.error(f"Error initializing OpenAI client: {str(e)}")
            return False
        
    def analyze_common_pain_points(self, posts, product_name):
        """
        Analyze multiple posts to identify common pain points for a product
        
        Args:
            posts (list): List of RedditPost objects
            product_name (str): Name of the product being analyzed
            
        Returns:
            dict: Common pain points analysis
        """
        if not self.api_key or not self.client:
            logger.error("OpenAI API key not configured. Cannot analyze common pain points.")
            return {
                "error": "OpenAI API key not configured",
                "common_pain_points": []
            }
            
        if not posts:
            return {
                "common_pain_points": [],
                "analysis_summary": "No posts to analyze"
            }
            
        # Prepare post data for the API
        post_texts = []
        for post in posts:
            post_texts.append({
                "title": post.title,
                "content": post.content,
                "score": post.score,
                "num_comments": post.num_comments
            })
            
        # Create a prompt for OpenAI
        prompt = f"""
        Analyze the following Reddit posts that may be related to {product_name}. Your task is to identify up to 10 distinct pain points that users have *clearly* associated with {product_name}. Do not include general complaints unless they are specifically tied to {product_name}.

        {json.dumps(post_texts, indent=2)}

        From these posts, extract only the pain points that are genuinely and explicitly relevant to {product_name}.

        For each pain point, provide:
        1. A concise name (max 3-5 words)
        2. A detailed description of the issue
        3. The severity level (high, medium, low)
        4. Potential solutions or workarounds
        5. Related keywords or phrases that frequently appear

        Respond with valid JSON in this exact format:
        {{
            "common_pain_points": [
                {{
                    "name": "Pain point name",
                    "description": "Detailed description",
                    "severity": "high|medium|low",
                    "potential_solutions": "Suggestions for addressing this issue",
                    "related_keywords": ["keyword1", "keyword2"]
                }}
            ],
            "analysis_summary": "Brief overview of your findings"
        }}

        Only include up to 10 pain points and skip any that are not clearly connected to {product_name}.
        """
        
        try:
            logger.info(f"Sending request to OpenAI to analyze pain points for {product_name}")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=1500
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            logger.info(f"Successfully analyzed common pain points for {product_name}")
            
            # Add timestamp to the results
            result["analysis_timestamp"] = datetime.now().isoformat()
            result["product"] = product_name
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing pain points with OpenAI: {str(e)}")
            return {
                "error": str(e),
                "common_pain_points": [],
                "analysis_summary": f"Error during analysis: {str(e)}"
            }
            
    def generate_recommendations(self, pain_points, product_name):
        """
        Generate recommendations for addressing the identified pain points
        
        Args:
            pain_points (list): List of pain point dictionaries
            product_name (str): Name of the product
            
        Returns:
            dict: Recommendations for product improvements
        """
        if not self.api_key or not self.client:
            logger.error("OpenAI API key not configured. Cannot generate recommendations.")
            return {
                "error": "OpenAI API key not configured",
                "recommendations": []
            }
            
        if not pain_points:
            return {
                "recommendations": [],
                "summary": "No pain points to analyze"
            }
            
        # Create a prompt for OpenAI
        prompt = f"""
        Based on the following pain points identified for {product_name}:
        
        {json.dumps(pain_points, indent=2)}
        
        Generate actionable recommendations for how these issues could be addressed through a browser extension or similar product.
        
        For each recommendation, provide:
        1. A concise title
        2. Detailed description of the solution
        3. Implementation complexity (high, medium, low)
        4. Potential impact on user experience (high, medium, low)
        5. Date of the last user post containg this issue (YYYY-MM-DD)
        
        Respond with valid JSON in this exact format:
        {{
            "recommendations": [
                {{
                    "title": "Recommendation title",
                    "description": "Detailed description",
                    "complexity": "high|medium|low",
                    "impact": "high|medium|low",
                    "addresses_pain_points": ["pain point name 1", "pain point name 2", ...],
                    "most_recent_occurence": "YYYY-MM-DD"
                }}
            ],
            "summary": "Brief overview of your recommendations"
        }}
        """
        
        try:
            logger.info(f"Sending request to OpenAI to generate recommendations for {product_name}")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=1500
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            logger.info(f"Successfully generated recommendations for {product_name}")
            
            # Add timestamp to the results
            result["timestamp"] = datetime.now().isoformat()
            result["product"] = product_name
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating recommendations with OpenAI: {str(e)}")
            return {
                "error": str(e),
                "recommendations": [],
                "summary": f"Error during recommendation generation: {str(e)}"
            }