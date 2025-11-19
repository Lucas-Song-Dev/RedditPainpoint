from flask import Blueprint, render_template
from flask_restful import Api
from api import (
    Register, Login, Logout, ScrapePosts, Recommendations,
    GetPainPoints, GetPosts, GetStatus, ResetScrapeStatus,
    GetOpenAIAnalysis, GetAllProducts, RunAnalysis
)

# Create blueprint for main routes
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render the admin dashboard page"""
    return render_template('index.html')

def initialize_routes(api):
    """Initialize all API routes."""
    api.add_resource(Register, '/api/register')
    api.add_resource(Login, '/api/login')
    api.add_resource(Logout, '/api/logout')
    api.add_resource(ScrapePosts, '/api/scrape')
    api.add_resource(Recommendations, '/api/recommendations')
    api.add_resource(GetPainPoints, '/api/pain-points')
    api.add_resource(GetPosts, '/api/posts')
    api.add_resource(GetStatus, '/api/status')
    api.add_resource(ResetScrapeStatus, '/api/reset-status')
    api.add_resource(GetOpenAIAnalysis, '/api/openai-analysis')
    api.add_resource(GetAllProducts, '/api/all-products')
    api.add_resource(RunAnalysis, '/api/run-analysis')
