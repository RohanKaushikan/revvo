from flask import Flask, request
from flask_cors import CORS
from .routes.recommendation import recommendations_bp
from .routes.listings import listings_bp
import os
from dotenv import load_dotenv

def create_app():
    app = Flask(__name__)

    load_dotenv()

    # Get Vercel URL from environment or allow all origins in production
    allowed_origins = [
        "http://localhost:5173", 
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173"
    ]
    
    # Add Vercel URL if provided
    vercel_url = os.getenv("VERCEL_URL")
    if vercel_url:
        allowed_origins.append(f"https://{vercel_url}")
    
    # Allow all origins in production (Vercel will handle CORS)
    # Or specify your production domain
    production_url = os.getenv("PRODUCTION_URL")
    if production_url:
        allowed_origins.append(production_url)
    
    CORS(
        app,
        origins=allowed_origins if allowed_origins else ["*"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )
    
    app.secret_key = os.getenv("SECRET_KEY")

    app.register_blueprint(recommendations_bp, url_prefix="/recommendations")
    app.register_blueprint(listings_bp, url_prefix="/listings")
    @app.route("/")
    def root():
        return {"message": "HackPrincetonF25 backend running on AWS-ready Flask app"}
    
    

    return app
