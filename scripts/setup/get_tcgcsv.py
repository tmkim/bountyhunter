from datetime import datetime
import logging
from pathlib import Path
from db_connect import connect_psql
import pandas as pd
import requests
from sqlalchemy import types

"""
Step 1:
    Download all CSVs
    > log any failures

Step 2: Perform ETL one CSV at a time
        > read the csv
        > clean the data
        > update our database
        > log success/failure

Updating the database:
    History table is updated with existing row data from Bounty table
    Bounty table is updated IFF csv's price is different than existing price
"""
# Connect to Database
database = connect_psql()

# Setup project root directory
project_root = Path(__file__).resolve().parent.parent.parent

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
def get_set_ids(df):
    """
    Input: DataFrame - data from one_piece_sets table
    Output: List - IDs contained in dataframe
    """
    set_ids = []
    for i in df['id']:
        set_ids.append(i)
    
    return set_ids

# Download CSVs from tcgcsv.com if we don't have the CSV already
def get_csvs(set_list):
    """
    Input: list of Set IDs from our database
        For each ID, check if we have the CSV.
            If yes, skip this step (log skipped CSV)
            If no, download the appropriate CSV
        Log all success/failure

    Output: prices directory
    """
    curr_date = datetime.today().strftime("%Y-%m-%d")
    prices_dir = project_root / "prices" / f"{curr_date}"
    # data_dir = Path(f"prices_{curr_date}")
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

def csv_etl(csv_dir: Path):

    # Set up expected column headers
    EXPECTED_COLUMNS = ['productId','cleanName','imageUrl','url','marketPrice',
                         'extRarity','extNumber','extDescription','extColor',
                         'extCardType','extLife','extPower','extSubtypes',
                         'extAttribute','extCost','extCounterplus']

    # Set up data type mapping to ensure safe values
    dtype_map = {
        'id': types.INTEGER(),
        'name': types.String(),
        'image_url': types.String(),
        'tcgplayer_url': types.String(),
        'market_price': types.DECIMAL(),
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

    df_csv_list = []
    csv_list = list(csv_dir.iterdir())

    for count, file in enumerate(csv_list):
        filename = "/".join(str(file).split('/')[-2:])
        print(f"\rETL on CSV: {filename} ({count+1}/{len(csv_list)})", end='', flush=True)

        # Extract data from CSV
        df_csv = pd.read_csv(file)

        for col in EXPECTED_COLUMNS:
            if col not in df_csv.columns:
                df_csv[col] = pd.NA

        df_csv = df_csv[EXPECTED_COLUMNS]
        
        # Transform data in dataframe
        df_csv = df_csv.rename(columns={
            'productId': 'id',
            'cleanName': 'name',
            'imageUrl': 'image_url',
            'url': 'tcgplayer_url',
            'marketPrice': 'market_price',
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

        # Build list of dataframes
        df_csv_list.append(df_csv)
    # Ensure new line at the end of progress
    print()

    # Make sure all dataframes are aligned with expected columns
    aligned_df_list = []
    for df in df_csv_list:
        for col in EXPECTED_COLUMNS:
            if col not in df.columns:
                df[col] = pd.NA
        df = df[EXPECTED_COLUMNS]  # enforce column order
        aligned_df_list.append(df)

    # Concatenate list of dataframes into a single dataframe before loading into database
    master_df_csv = pd.concat(aligned_df_list, ignore_index=True)

    print("Loading dataframe into database...")
    master_df_csv.to_sql('one_piece_bounty', database, if_exists='replace', dtype=dtype_map)

    print("ETL Complete!")


if __name__ == "__main__":
    df_set_list = pd.read_sql('one_piece_sets', con=database)

    op_sets = get_set_ids(df_set_list)

    csv_dir = get_csvs(op_sets)
    
    csv_etl(csv_dir)