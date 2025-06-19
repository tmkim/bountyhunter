"""
Seed database with some initial data
- one_piece_card_set: read one piece groups csv (pre-downloaded), upload to database
- one_piece_card: for each dir in prices/ upload csv data to database
- one_piece_card_history: for each dir in prices/ upload csv data to database
"""
from pathlib import Path
from sqlalchemy import Engine
import pandas as pd
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, types, text

# Setup project root directory
project_root = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv()

def connect_psql():
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    name = os.getenv("DB_NAME")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")

    engine = create_engine(f"postgresql://{user}:{password}@{host}:{port}/{name}")
    return engine

def seed_card_set(db: Engine):
    # Load CSV
    file_path = "op_card_set_init.csv"
    df = pd.read_csv(file_path)

    # Set desired columns
    df = df[['groupId', 'name', 'abbreviation']]

    # Clean data
    df['abbreviation'] = df['abbreviation'].str.replace(" ", "_")

    # Rename headers
    df = df.rename(columns={
        "groupId": "id",
        "name": "tmp_description",
        "abbreviation": "tmp_name"
    }).rename(columns={
        "tmp_description": "description",
        "tmp_name": "name"
    })

    # Reorder columns for consistency
    df = df[['id', 'name', 'description']]

    df.to_sql('one_piece_card_set', db, if_exists="replace", index=False)

def seed_card_and_history(db: Engine):
    # Set up expected column headers
    EXPECTED_INPUT = ['productId','cleanName','imageUrl','url','marketPrice',
                         'subTypeName','extRarity','extNumber','extDescription','extColor',
                         'extCardType','extLife','extPower','extSubtypes',
                         'extAttribute','extCost','extCounterplus']
    
    EXPECTED_COLUMNS = ['id','name','image_url','tcgplayer_url','market_price',
                        'foil_type','rarity','card_id','description','color',
                        'card_type','life','power','subtype',
                        'attribute','cost','counter','last_update']

    # Set up data type mapping to ensure proper values
    dtype_map = {
        'id': types.String(),
        'name': types.String(),
        'image_url': types.String(),
        'tcgplayer_url': types.String(),
        'market_price': types.DECIMAL(),
        'foil_type': types.String(),
        'rarity': types.String(),
        'card_id': types.String(),
        'description': types.String(),
        'color': types.String(),
        'card_type': types.String(),
        'life': types.INTEGER(),
        'power': types.INTEGER(),
        'subtype': types.String(),
        'attribute': types.String(),
        'cost': types.INTEGER(),
        'counter': types.INTEGER()
    }

    int_cols = ['life', 'power', 'cost', 'counter']
    float_cols = ['market_price']
    str_cols = ['id', 'name', 'image_url', 'tcgplayer_url', 'foil_type', 'rarity', 'card_id', 
                'description', 'color', 'card_type', 'subtype', 'attribute']
    
    prices_dir = project_root / "prices"
    daily_list = list(prices_dir.iterdir())
    
    for daily_dir in daily_list:
        df_csv_list = []
        csv_list = list(daily_dir.iterdir())

        for csv in csv_list:
            try:
                # Extract data from CSV
                df_csv = pd.read_csv(csv)
                
                # Transform data in dataframe
                for col in EXPECTED_INPUT:
                    if col not in df_csv.columns:
                        df_csv[col] = pd.NA

                df_csv = df_csv[EXPECTED_INPUT]

                df_csv = df_csv.rename(columns={
                    'productId': 'id',
                    'cleanName': 'name',
                    'imageUrl': 'image_url',
                    'url': 'tcgplayer_url',
                    'marketPrice': 'market_price',
                    'subTypeName': 'foil_type',
                    'extRarity': 'rarity',
                    'extNumber': 'card_id',
                    'extDescription': 'description',
                    'extColor': 'color',
                    'extCardType': 'card_type',
                    'extLife': 'life',
                    'extPower': 'power',
                    'extSubtypes': 'subtype',
                    'extAttribute': 'attribute',
                    'extCost': 'cost',
                    'extCounterplus': 'counter'
                })

                # Ensure all null values are safe
                for col in int_cols:
                    df_csv[col] = df_csv[col].astype('Int64')

                for col in float_cols:
                    df_csv[col] = df_csv[col].astype('Float64')

                for col in str_cols:
                    df_csv[col] = df_csv[col].astype('string')
                    
                df_csv['last_update'] = pd.Timestamp.now()

                # Ensure proper order for dataframe
                df_csv = df_csv[EXPECTED_COLUMNS]

                # Check for duplicates
                # df_csv = df_csv.drop_duplicates(subset='id', keep='first')

                # Identify duplicate card_ids, then update the id for foil rows in those duplicates
                duplicate_ids = df_csv['id'][df_csv.duplicated('id', keep=False)]
                df_csv.loc[df_csv['id'].isin(duplicate_ids) & (df_csv['foil_type'] == 'Foil'), 'id'] += 'f'

                # Append to list of dataframes
                df_csv_list.append(df_csv)

            except Exception as e:
                print(f"Error loading CSVs: {e}")

        # Concatenate master DF
        master_df_csv = pd.concat(df_csv_list, ignore_index=True)
        print(master_df_csv.head)

        # Populate card table
        with db.begin() as conn:
            conn.execute(text("DELETE FROM one_piece_card"))

        master_df_csv.to_sql('one_piece_card', db, if_exists='append', dtype=dtype_map, index=False)

        # Populate history table
        master_df_csv = master_df_csv.rename(columns={
            'last_update': 'history_date'
        })
        master_df_csv.to_sql('one_piece_card_history', db, if_exists='append', dtype=dtype_map, index=False)
        print(f"{daily_dir} seeded")


if __name__ == "__main__":
    database = connect_psql()

    #seed_card_set(database)
    seed_card_and_history(database)