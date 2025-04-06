from flask import Blueprint, render_template

# Create blueprint for main routes
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render the admin dashboard page"""
    return render_template('index.html')
