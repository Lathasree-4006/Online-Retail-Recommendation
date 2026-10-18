
from pathlib import Path
import pandas as pd

# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "dataset" / "styles.csv"
IMAGE_DIR = BASE_DIR / "dataset" / "images"
OUTPUT_DIR = BASE_DIR / "backend" / "data"
OUTPUT_PATH = OUTPUT_DIR / "products.csv"

# Columns required for our recommendation system
REQUIRED_COLUMNS = [
    "id",
    "gender",
    "masterCategory",
    "subCategory",
    "articleType",
    "baseColour",
    "season",
    "usage",
    "productDisplayName",
]

def main():
    print("Loading fashion dataset...")

    # Skip malformed CSV rows identified during our earlier check
    df = pd.read_csv(DATASET_PATH, on_bad_lines="skip")

    # Keep only the fields needed by our application
    df = df[REQUIRED_COLUMNS].copy()

    # Product IDs must be numeric and unique
    df["id"] = pd.to_numeric(df["id"], errors="coerce")
    df = df.dropna(subset=["id"])
    df["id"] = df["id"].astype(int)
    df = df.drop_duplicates(subset=["id"])

    # Clean missing text values
    text_columns = [
        "gender",
        "masterCategory",
        "subCategory",
        "articleType",
        "baseColour",
        "season",
        "usage",
        "productDisplayName",
    ]

    for column in text_columns:
        df[column] = df[column].fillna("Unknown").astype(str).str.strip()
        df.loc[df[column] == "", column] = "Unknown"

    # Connect each product to its corresponding local image
    df["image_url"] = df["id"].apply(
        lambda product_id:
            f"/images/{product_id}.jpg"
            if (IMAGE_DIR / f"{product_id}.jpg").is_file()
            else ""
    )

    # Save a clean catalogue for the backend
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)

    print("\nDataset preparation completed!")
    print("Products saved:", len(df))
    print("Products with images:", (df["image_url"] != "").sum())
    print("Products without images:", (df["image_url"] == "").sum())
    print("Output file:", OUTPUT_PATH)
    print("\nSample prepared products:")
    print(
        df[["id", "productDisplayName", "articleType", "image_url"]]
        .head(5)
        .to_string(index=False)
    )

if __name__ == "__main__":
    main()
