import pandas as pd
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

query = input('Enter card name: ')
search_name = df[df['name'].str.contains(query, case=False, na=False)]
print(f'{search_name.shape} cards found')

query = input('Enter card color: ')
search_color = search_name[search_name['color'].str.contains(query, case=False, na=False)]

card_results = search_color[['name', 'color', 'card_id', 'market_price']]
print(card_results.head)

filtered = search_df(df, "100_Luffy_pur", columns=['card_number', 'name', 'color'])
print(filtered)
