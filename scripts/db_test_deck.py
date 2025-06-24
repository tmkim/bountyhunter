import pandas as pd
from setup.db_connect import connect_psql
import questionary
import sqlalchemy
from sqlalchemy import select, and_, or_, join, tuple_
from setup.db.models import OnePieceDeck

user = input("Enter username: ")

stmt = select(OnePieceDeck).where(
    OnePieceDeck.user == user
)

with connect_psql().connect() as conn:
    df_decklist = pd.read_sql(stmt, conn)

deck_names = df_decklist['name'].tolist()

try:
    deck_select = questionary.select("Choose a deck:", choices=deck_names).ask()
    df_deck = df_decklist[df_decklist['name'] == deck_select]
except Exception as e:
    if 'A list of choices needs to be provided' in str(e):
        print(f"Error: No decks exist for user '{user}'")
    else:
        print(f"An unexpected error occurred: {e}")

if 'df_deck' in locals() and not df_deck.empty:
    print(df_deck)
