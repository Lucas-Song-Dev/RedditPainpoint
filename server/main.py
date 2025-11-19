from app import app

if __name__ == "__main__":
    # Enable debug mode for auto-reload on file changes
    app.run(host="0.0.0.0", port=5000, debug=True)
