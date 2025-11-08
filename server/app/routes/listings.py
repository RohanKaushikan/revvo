from flask import Blueprint, jsonify, request
import requests
import os

listings_bp = Blueprint("listings", __name__)

@account_bp.route("/listings", methods=["GET"])
def get_listings_by_():
    token = os.getenv("AUTO_DEV_KEY")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    response = requests.get(
        'https://api.auto.dev/listings',
        headers=headers
    )
    result = response.json()
    for listing in result['data']:
        vehicle = listing['vehicle']
        price = listing['retailListing']['price'] if listing['retailListing'] else 0
        print(f"{vehicle['year']} {vehicle['make']} {vehicle['model']} - ${price}")

