import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from models import Base
from models import OnePieceSet, OnePieceCard, OnePieceCardHistory, OnePieceDeck, OnePieceDeckCard

load_dotenv()

def connect_psql():
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    name = os.getenv("DB_NAME")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")

    engine = create_engine(f"postgresql://{user}:{password}@{host}:{port}/{name}")
    return engine

if __name__ == "__main__":
    engine = connect_psql()
    Base.metadata.create_all(engine)
    print(f"DB Initialized with tables {Base.metadata.tables.keys()}")
