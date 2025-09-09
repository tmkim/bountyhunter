import pandas as pd
from setup.db_connect import connect_psql
import questionary
import sqlalchemy
from sqlalchemy import select, and_, or_, join, tuple_
from setup.db.models import OnePieceDeck, OnePieceCard, OnePieceDeckCard

def deck_summ(df_deck):
    deck_id = df_deck['id'].iloc[0] 

    with connect_psql().connect() as conn:
        stmt_deck_cards = select(OnePieceDeckCard).where(
            OnePieceDeckCard.deck_id == deck_id
        )
        df_deck_cards = pd.read_sql(stmt_deck_cards, conn)
        df_deck_cards.rename(columns={
            'card_id': 'id'
        }, inplace=True)

        stmt_card_list = select(OnePieceCard).where(
            OnePieceCard.id.in_(df_deck_cards['id'].tolist())
        )
        df_card_list = pd.read_sql(stmt_card_list, conn)

    # print(df_card_list)
    # print(df_deck_cards)

    df_deck_summ = df_card_list.merge(df_deck_cards, on=["id"])
    df_deck_summ = df_deck_summ[['id', 'name', 'market_price', 'quantity']]
    df_deck_summ['card_price'] = round(df_deck_summ['market_price'] * df_deck_summ['quantity'], 2)
    print(df_deck_summ)

    # df_card_list['card_price'] = round(df_card_list['market_price'] * df_card_list['quantity'], 2)
    # df_summ = df_card_list[['card_id', 'name', 'market_price', 'quantity', 'card_price']].sort_values('card_id')

    # print(f"Total Price: ${round((df_card_list['market_price'] * df_card_list['quantity']).sum(),2)}")
    # print(df_summ)

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
    deck_summ(df_deck)
