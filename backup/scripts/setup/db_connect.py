import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

def connect_psql():
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    name = os.getenv("DB_NAME")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")

    engine = create_engine(f"postgresql://{user}:{password}@{host}:{port}/{name}")
    return engine