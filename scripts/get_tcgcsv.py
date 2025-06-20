from datetime import datetime
import logging
from pathlib import Path
from setup.db_connect import connect_psql
import pandas as pd
import requests
from sqlalchemy import Engine, types, text

# Setup project root directory
project_root = Path(__file__).resolve().parent.parent

# Setup log file
log_dir = project_root / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"get_tcgcsv_{datetime.now().strftime('%Y-%m-%d')}.log"

logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Retrieve list of Set IDs from dataframe
def get_set_ids(db: Engine):
    """
    Input: DataFrame - data from one_piece_sets table
    Output: List - IDs contained in dataframe
    """
    df_set_list = pd.read_sql('one_piece_card_set', con=db)

    set_ids = []
    for i in df_set_list['id']:
        set_ids.append(i)
    
    return set_ids

# Download CSVs from tcgcsv.com if we don't have the CSV already
def get_csvs(set_list: list):
    """
    Input: list of Set IDs from our database
        For each ID, check if we have the CSV.
            If yes, skip this step (log skipped CSV)
            If no, download the appropriate CSV
        Log all success/failure

    Output: prices directory
    """
    curr_date = datetime.today().strftime("%Y-%m-%d")
    # curr_date = "2025-06-17"

    prices_dir = project_root / "prices" / f"{curr_date}"
    prices_dir.mkdir(parents=True, exist_ok=True)

    logging.info(f"----------- Begin Download: {curr_date} -----------")
    for count, id in enumerate(set_list):
        print(f"\rDownloading CSV: {id}.csv ({count+1}/{len(set_list)})", end='', flush=True)

        file_path = prices_dir / f"group_{id}.csv"
        csv_url = f"https://tcgcsv.com/tcgplayer/68/{id}/ProductsAndPrices.csv"

        if file_path.exists():
            logging.warning(f"CSV {curr_date}/group_{id}.csv already exists. Skipping.")
            continue

        try:
            response = requests.get(csv_url)
            response.raise_for_status()

            with open(file_path, "wb") as f:
                f.write(response.content)

            logging.info(f"Downloaded CSV: {curr_date}/group_{id}.csv")

        except Exception as e:
            logging.error(f"Failed to download CSV for {id}")
            logging.error(f"Error: {e}")
    logging.info("----------- Finish Download -----------")

    # Ensure new line at the end of progress
    print()

    return prices_dir

def csv_etl(db: Engine, csv_dir: Path):
    """
    Input: directory where CSVs are held
    Output: None
    -- Extract dataframes from CSVs
    -- Clean data and build a master dataframe
    -- Update card table and history table
    """

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

    # Build a list of dataframes from CSV files, 
    # concatenate into a single dataframe, then update database
    df_csv_list = []
    csv_list = list(csv_dir.iterdir())

    logging.info("--- Start loading CSVs ---")
    for count, file in enumerate(csv_list):
        filename = "/".join(str(file).split('/')[-2:])
        print(f"\rLoading CSV: {filename} ({count+1}/{len(csv_list)})", end='', flush=True)
        logging.info(f"Loading CSV: {filename}")

        try:
            # Extract data from CSV
            df_csv = pd.read_csv(file)
            
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

            # Identify duplicate card_ids, then update the id for foil rows in those duplicates
            duplicate_ids = df_csv['id'][df_csv.duplicated('id', keep=False)]
            df_csv.loc[df_csv['id'].isin(duplicate_ids) & (df_csv['foil_type'] == 'Foil'), 'id'] += 'f'

            # Append to list of dataframes
            df_csv_list.append(df_csv)

        except Exception as e:
            logging.error(f"Error loading CSVs: {e}")
            print(f"Error loading CSVs: {e}")


    # Ensure new line at the end of progress
    print()
    logging.info("--- Finish loading CSVs ---")

    # Concatenate list of dataframes into a single dataframe before loading into database
    try:
        master_df_csv = pd.concat(df_csv_list, ignore_index=True)
    except Exception as e:
        logging.error(f"Error concatenating dataframes: {e}")
        print(f"Error concatenating dataframes: {e}")

    # Update history and card tables
    print("Loading dataframe into database...")
    
    save_df_to_db(db, master_df_csv, dtype_map)

    print("ETL Complete!")

def update_partial(db, df):
    # Retrieve current Card data
    df_curr_card = pd.read_sql('one_piece_card', con=db)

    # Compare card data to find all prices that have changed since previous day
    merged = df.merge(
        df_curr_card[['id', 'name', 'foil_type', 'market_price']],
        on=['id', 'foil_type'],
        how='left',
        suffixes=('','_old')
    )
    changed_rows = merged[merged['market_price'] != merged['market_price_old']].copy()
    changed_rows = changed_rows.drop(columns=['market_price_old'])
    print(f'{len(changed_rows)} rows changed')

    # Update all table rows where the market price has changed
    with database.connect() as conn:
        for _, row in changed_rows.iterrows():
            stmt = text("""
                    UPDATE one_piece_card
                    SET market_price = :market_price
                    WHERE id = :id
                """)
            conn.execute(stmt, {
                'market_price': row['market_price'],
                'id': row['id']
            })

        conn.commit()

def save_df_to_db(db: Engine, df: pd.DataFrame, dtype_map: dict[str, any]):
    """
    Input: dataframe with CSV data to be entered into Database
           data type mapping
    Output: Pass/Fail(?) - database is updated with new data

    Step 1: Append current Card table into History table
    Step 2: Update current Card table with new Card table
        ++ Realistically only need to change market_price
        ++ check whether market_price has changed -- if not, no update
        ++ if there are any new cards, they need to be appended
    """
    try:
        # Update current Card table
        # Optional : update_partial(df) -- won't update timestamp for all rows
        # Populate card table
        with db.begin() as conn:
            conn.execute(text("DELETE FROM one_piece_card"))

        df.to_sql('one_piece_card', db, if_exists='append', dtype=dtype_map, index=False)
        
        # Append data to History table
        df = df.rename(columns={
            'last_update': 'history_date'
        })
        df.to_sql('one_piece_card_history', db, if_exists='append', dtype=dtype_map, index=False)
    except Exception as e:
        logging.error(f"Error saving to database: {e}")
        print(f"Error saving to database: {e}")

if __name__ == "__main__":
    database = connect_psql()

    try:
        # Read database to get list of card sets
        op_sets = get_set_ids(database)

        # Download card set CSVs from tcgcsv.com
        csv_dir = get_csvs(op_sets)

        # Perform ETL operations on card set CSVs
        csv_etl(database, csv_dir)
    except Exception as e:
        print(f"Error: {e}")