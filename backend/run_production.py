from waitress import serve
from app import app, init_app
import logging

if __name__ == '__main__':
    # Initialize the data and ML models
    init_app()

    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger('waitress')
    logger.info("Starting COMPLAX Production Server on http://0.0.0.0:5000")

    # Serve the app using Waitress (Production WSGI Server)
    serve(app, host='0.0.0.0', port=5000)
