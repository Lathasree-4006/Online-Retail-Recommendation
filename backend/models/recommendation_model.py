
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "products.csv"


class FashionRecommendationModel:
    def __init__(self):
        self.products = None
        self.feature_matrix = None
        self.vectorizer = None
        self.product_id_to_index = {}

    def load_data(self):
        """Load products and prepare their text features."""
        self.products = pd.read_csv(DATA_PATH)
        self.products["id"] = self.products["id"].astype(int)

        self.product_id_to_index = {
            product_id: index
            for index, product_id in enumerate(self.products["id"])
        }

        feature_columns = [
            "gender",
            "masterCategory",
            "subCategory",
            "articleType",
            "baseColour",
            "season",
            "usage",
            "productDisplayName",
        ]

        self.products["features"] = (
            self.products[feature_columns]
            .fillna("Unknown")
            .astype(str)
            .agg(" ".join, axis=1)
        )

        print(f"Loaded {len(self.products)} products.")

    def train(self):
        """Convert product descriptions into sparse TF-IDF vectors."""
        if self.products is None:
            self.load_data()

        self.vectorizer = TfidfVectorizer(
           stop_words="english",
           dtype="float64",
           max_features=30000,
        )

        self.feature_matrix = self.vectorizer.fit_transform(
            self.products["features"]
        )

        print("TF-IDF model trained successfully.")
        print("Feature matrix shape:", self.feature_matrix.shape)

    def recommend(self, product_id, top_n=8):
        """Find similar products without building a full similarity matrix."""
        if self.feature_matrix is None:
            self.train()

        try:
            product_id = int(product_id)
        except (TypeError, ValueError):
            return []

        if product_id not in self.product_id_to_index:
            return []

        index = self.product_id_to_index[product_id]

        # Compare this product against the catalogue one row at a time.
        scores = cosine_similarity(
            self.feature_matrix[index],
            self.feature_matrix,
            dense_output=True,
        ).ravel()

        # Exclude the selected product itself.
        scores[index] = -1

        # Select the highest-scoring products.
        top_n = max(1, min(int(top_n), len(scores) - 1))
        indices = scores.argsort()[-top_n:][::-1]

        results = self.products.iloc[indices].copy()
        results["similarity_score"] = scores[indices]

        return results.drop(
            columns=["features"],
            errors="ignore",
        ).to_dict(orient="records")


if __name__ == "__main__":
    model = FashionRecommendationModel()
    model.load_data()
    model.train()

    test_product_id = 15970
    recommendations = model.recommend(test_product_id, top_n=5)

    print(f"\nRecommendations for product ID {test_product_id}:")
    for product in recommendations:
        print(
            f'{product["id"]} | '
            f'{product["productDisplayName"]} | '
            f'{product["articleType"]} | '
            f'Similarity: {product["similarity_score"]:.3f}'
        )
