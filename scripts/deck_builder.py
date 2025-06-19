"""
Now that our database is populated with all of our One Piece cards,
we want to use those cards to build and analyze decks

Eventually we can add functionality to save decks and look them up

Functions:
    build_deck_list(list of cards):
        Accepts a list of cards and creates a deck
    build_deck():
        Allow user to enter one card at a time
        - prompt user on decisions such as quantity, alt art, foil, etc
"""

from datetime import datetime
import logging
from pathlib import Path
from setup.db_connect import connect_psql
import pandas as pd
import requests
from sqlalchemy import types, text

# Connect to Database
database = connect_psql()

# Setup project root directory
project_root = Path(__file__).resolve().parent.parent

# Setup log file
log_dir = project_root / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"deck_builder_{datetime.now().strftime('%Y-%m-%d')}.log"

logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

