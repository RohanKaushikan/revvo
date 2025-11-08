from flask import Flask, request
from flask_cors import CORS
#from .routes.products import products_bp
import os
from dotenv import load_dotenv

def create_app():
    app = Flask(__name__)

    load_dotenv()

    CORS(
        app,
        origins=["http://localhost:5173"], #add frontend url once hosted
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )
    
    app.secret_key = os.getenv("SECRET_KEY")

    #app.register_blueprint(products_bp, url_prefix="/api/products")

    @app.route("/")
    def root():
        return {"message": "HackPrincetonF25 backend running on AWS-ready Flask app"}
    
    

    return app
