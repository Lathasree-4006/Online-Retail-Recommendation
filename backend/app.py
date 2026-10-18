
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from models.recommendation_model import FashionRecommendationModel


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DATASET_IMAGE_DIR = PROJECT_DIR / "dataset" / "images"

app = Flask(__name__)
CORS(app)

# Load and train the model once when the server starts.
model = FashionRecommendationModel()
model.load_data()
model.train()

products = model.products


def product_to_dict(row):
    """Convert a product row to JSON-safe data."""
    result = row.to_dict()

    for key, value in result.items():
        if hasattr(value, "item"):
            result[key] = value.item()

    return result


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "Fashion Recommendation API is running",
        "total_products": len(products),
    })


@app.route("/api/products", methods=["GET"])
def get_products():
    query = request.args.get("q", "").strip()
    category = request.args.get("category", "").strip()
    limit = request.args.get("limit", 30, type=int)
    limit = max(1, min(limit, 100))

    filtered = products.copy()

    if query:
        searchable = (
            filtered["productDisplayName"].astype(str)
            + " "
            + filtered["articleType"].astype(str)
            + " "
            + filtered["baseColour"].astype(str)
            + " "
            + filtered["gender"].astype(str)
            + " "
            + filtered["masterCategory"].astype(str)
        )

        filtered = filtered[
            searchable.str.contains(query, case=False, na=False, regex=False)
        ]

    if category:
        filtered = filtered[
            filtered["masterCategory"].astype(str).str.casefold()
            == category.casefold()
        ]

    return jsonify({
        "count": len(filtered),
        "products": [
            product_to_dict(row)
            for _, row in filtered.head(limit).iterrows()
        ],
    })


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    matches = products[products["id"] == product_id]

    if matches.empty:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(product_to_dict(matches.iloc[0]))


@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():
    product_id = request.args.get("product", type=int)
    limit = request.args.get("limit", 8, type=int)
    limit = max(1, min(limit, 20))

    if product_id is None:
        return jsonify({
            "error": "Please provide a product ID using ?product=15970"
        }), 400

    if product_id not in model.product_id_to_index:
        return jsonify({"error": "Product not found"}), 404

    recommendations = model.recommend(product_id, top_n=limit)

    return jsonify({
        "product_id": product_id,
        "count": len(recommendations),
        "recommendations": recommendations,
    })


@app.route("/api/analytics", methods=["GET"])
def analytics():
    category_counts = (
        products["masterCategory"]
        .value_counts()
        .to_dict()
    )

    article_counts = (
        products["articleType"]
        .value_counts()
        .head(10)
        .to_dict()
    )

    return jsonify({
        "total_products": len(products),
        "products_with_images": int(
            (products["image_url"] != "").sum()
        ),
        "categories": category_counts,
        "popular_article_types": article_counts,
    })


@app.route("/images/<path:filename>", methods=["GET"])
def product_image(filename):
    # Only serve image files from the dataset image directory.
    if not filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        return jsonify({"error": "Unsupported image type"}), 400

    return send_from_directory(DATASET_IMAGE_DIR, filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
