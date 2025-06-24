import pandas as pd
from setup.db_connect import connect_psql

database = connect_psql()
df_cards = pd.read_sql('one_piece_card', con=database)
card_ids = df_cards['card_id']

# print(all_cards.head)

cards_by_id = df_cards.sort_values(by="card_id")[['id','card_id','name']]

cards_by_id["name_length"] = cards_by_id["name"].str.len()
cards_by_id = cards_by_id.loc[cards_by_id.groupby("card_id")["name_length"].idxmin()]
cards_by_id = cards_by_id.drop(columns=["name_length"])

cards_by_id.to_csv('cards_by_id.csv')
# cards_by_id.duplicated('card_id').to_csv('cards_by_id.csv')