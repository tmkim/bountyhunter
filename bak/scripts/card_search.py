import pandas as pd
import questionary
from setup.db_connect import connect_psql

database = connect_psql()

def search_df(df, query, columns, delimiter="_"):
    terms = query.lower().split(delimiter)
    
    # Define a row filter function
    def row_matches(row):
        row_text = ' '.join([str(row[col]).lower() for col in columns])
        return all(term in row_text for term in terms)
    
    return df[df.apply(row_matches, axis=1)]


df = pd.read_sql('one_piece_card', database)

# query = input('Enter card name: ')
# search_name = df[df['name'].str.contains(query, case=False, na=False)]
# print(f'{search_name.shape} cards found')

# query = input('Enter card color: ')
# search_color = search_name[search_name['color'].str.contains(query, case=False, na=False)]

# card_results = search_color[['name', 'color', 'card_id', 'market_price']]
# print(card_results.head)

query = input('Enter card query: ')
filtered = search_df(df, query, columns=['card_id', 'name', 'color'])
card_results = filtered[['name', 'color', 'card_id', 'market_price']]
print(card_results)

df_card_id = card_results.drop_duplicates(subset=['card_id'])
card_id_list = df_card_id['card_id'].tolist()
card_id_list = list(filter(None, card_id_list))
print(card_id_list)

card_select = questionary.select("Select a card: ", choices=card_id_list).ask()
filtered_select = search_df(card_results, card_select, columns=['card_id'])
filtered_select = filtered_select[['name', 'market_price']].sort_values(['market_price'])
print(filtered_select)