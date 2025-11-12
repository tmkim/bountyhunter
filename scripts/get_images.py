import os
import requests
import boto3
import psycopg2
from io import BytesIO
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

script_dir = os.path.dirname(os.path.abspath(__file__))
cards_dir = os.path.abspath(os.path.join(script_dir, "..", "frontend", "public", "cards"))

# --- DB setup ---
conn = psycopg2.connect(
    dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT
)
cursor = conn.cursor()

cursor.execute("SELECT id, image_url FROM one_piece_card;")
rows = cursor.fetchall()

def get_filename_from_url(url):
    parsed = urlparse(url)
    return os.path.basename(parsed.path)

def download_image(url):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200 and "image" in response.headers.get("Content-Type", ""):
            return BytesIO(response.content)
    except Exception as e:
        print(f"❌ Error downloading {url}: {e}")
    return None

for record in rows:
    id_, image_url = record
    filename = get_filename_from_url(image_url) or f"{id_}.jpg"
    filepath = os.path.join(cards_dir, filename)

    if os.path.exists(filepath):
        print(f"↩️ Skipping {filename} (already exists)")
        continue

    print(f"Processing: {image_url}")

    img_data = download_image(image_url)
    if not img_data:
        # Use fallback
        print(f"⚠️ Invalid image for {filename}")
    else:
        with open(filepath, "wb") as f:
            f.write(img_data.getbuffer())
        print(f"✅ Saved {filename} to {filepath}")

cursor.close()
conn.close()
print("🎉 Done uploading all images!")
