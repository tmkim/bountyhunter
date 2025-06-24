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
import uuid

import sqlalchemy
from setup.db_connect import connect_psql
import pandas as pd
from sqlalchemy import select, and_, or_, join, tuple_
from setup.db.models import OnePieceCard

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

def build_deck_list(deck_list: list, database: sqlalchemy.Engine) -> pd.DataFrame:
    """
    Input: List of cards using CARD_IDxQUANTITY format
    Output: Dataframe with relevant info for every card in the list
    """

    deck = []

    for card in deck_list:
        info = card.split('x')
        card_id = info[0]
        quantity = int(info[1])

        deck.append({
            "card_id": card_id,
            "foil_type": "Normal",
            "quantity": quantity
            })

    lookup_keys = [(entry["card_id"], entry["foil_type"]) for entry in deck]

    # Query full card info
    stmt = select(OnePieceCard).where(
        tuple_(OnePieceCard.card_id, OnePieceCard.foil_type).in_(lookup_keys)
    )

    # Connect to Database
    df_cards = pd.read_sql_query(stmt, database)
    df_deck = pd.DataFrame(deck)

    df_cards["name_length"] = df_cards["name"].str.len()
    df_cards = df_cards.loc[df_cards.groupby("card_id")["name_length"].idxmin()]
    df_cards = df_cards.drop(columns=["name_length"])

    df_merged = df_cards.merge(df_deck, on=["card_id","foil_type"])

    return df_merged

def save_deck_to_db(deck_df: pd.DataFrame, user, name, database: sqlalchemy.Engine):
    deck_id = str(uuid.uuid4())
    
    # Set up dataframes for Deck and Deck_Cards
    df_deck = pd.DataFrame([{
        'id': deck_id,
        'name': name,
        'user': user
    } ])

    df_deck_cards = deck_df[['id', 'quantity']].copy()
    df_deck_cards['deck_id'] = deck_id
    df_deck_cards.rename(
        columns={
            'id': 'card_id'
        },
        inplace=True
    )
    df_deck_cards = df_deck_cards[['deck_id', 'card_id', 'quantity']]

    try:
        df_deck.to_sql('one_piece_deck', database, if_exists='append', index=False)
        df_deck_cards.to_sql('one_piece_deck_card', database, if_exists='append', index=False)
    except Exception as e:
        print(f"Failed to save deck {name}: {e}")

def deck_summ(df_deck):
    df_deck['card_price'] = round(df_deck['market_price'] * df_deck['quantity'], 2)
    df_summ = df_deck[['card_id', 'name', 'foil_type', 'market_price', 'quantity', 'card_price']].sort_values('card_id')

    print(f"Total Price: ${round((df_deck['market_price'] * df_deck['quantity']).sum(),2)}")
    print(df_summ.head)
    # df_deck.to_csv('decklist.csv')

if __name__ == "__main__":
    # ST04-001x04,ST03-002x02,ST04-003x01,ST04-004x02,ST03-005x01,ST03-006x04,ST04-007x04,ST01-008x01,ST01-009x01,ST03-001x03,ST02-002x03,ST02-003x04,ST02-004x02,ST06-005x02,ST02-006x02,ST02-007x01,ST05-008x01,ST02-009x01,ST02-001x02,ST01-002x04,ST05-003x01,ST01-004x02,ST01-005x03,ST02-006x01,ST01-007x03,ST05-008x02,ST03-009x03
    # deck_input = input("Enter deck list: ")
    deck_input = 'ST04-001x04,ST03-002x02,ST04-003x01,ST04-004x02,ST03-005x01,ST03-006x04,ST04-007x04,ST01-008x01,ST01-009x01,ST03-001x03,ST02-002x03,ST02-003x04,ST02-004x02,ST06-005x02,ST02-006x02,ST02-007x01,ST05-018x01,ST02-009x01,ST02-001x02,ST01-002x04,ST05-003x01,ST01-004x02,ST01-005x03,ST02-013x01,ST01-007x03,ST05-008x02,ST03-009x03'
    deck_list = [card.strip() for card in deck_input.split(',')]

    database = connect_psql()
    df_deck = build_deck_list(deck_list, database)

    deck_summ(df_deck)

    ask_save = True 
    save_deck = True
    while ask_save:
        save_input  = input("Save deck? (Y/N): ")
        if save_input == 'Y':
            ask_save = False
            save_deck = True
        elif save_input == 'N':
            ask_save = False
            save_deck = False
        else:
            print("Invalid input. Please input 'Y' or 'N'")

    if save_deck:
        user = input("Enter User: ")
        name = input("Enter Deck Name: ")
        save_deck_to_db(df_deck, user, name, database)