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

"""
We will start with building from a basic list, ignoring alternates and foils
We can match using card_id which follows "ST02-014" and "x##" for quantity
ex: ST02-014x04, st04-014x02, etc...
"""

def build_deck_list(deck_list: list) -> pd.DataFrame:
    """
    Input: List of cards using CARD_IDxQUANTITY format
    Output: Dataframe with relevant info for every card in the list
    """
    # Connect to Database
    database = connect_psql()

    deck = []

    for card in deck_list:
        info = card.split('x')
        card_id = info[0]
        quantity = int(info[1])

        # !!!!!!!!!!!!!!! Update query to be more specific !!!!!!!!!!!!!!!!!
        query = "SELECT card_id, name, market_price FROM one_piece_card WHERE card_id = %s LIMIT 1"

        df = pd.read_sql_query(query, database, params=(card_id,))
        df['quantity'] = quantity 

        deck.append(df)

    return pd.concat(deck, ignore_index=True)

if __name__ == "__main__":
    deck_input = input("Enter deck list: ")
    deck_list = [card.strip() for card in deck_input.split(',')]

    df_deck = build_deck_list([deck_list])
    print(df_deck)