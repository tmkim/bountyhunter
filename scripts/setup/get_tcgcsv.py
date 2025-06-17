from datetime import datetime
import logging
from pathlib import Path
from db_connect import connect_psql
import pandas as pd
import requests

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

# Retrieve list of Set IDs from database
def get_set_ids():
    set_ids = []
    for i in df['id']:
        set_ids.append(i)
    
    return set_ids

# Download CSVs from tcgcsv.com if we don't have the CSV already
def get_csvs():
    """
        Retrieve a list of Set IDs from our database
        For each ID, check if we have the CSV.
            If yes, skip this step (log skipped CSV)
            If no, download the appropriate CSV

        If there is any failure, log missing CSVs
    """
    curr_date = datetime.today().strftime("%Y-%m-%d")
    prices_dir = project_root / "prices" / f"{curr_date}"
    # data_dir = Path(f"prices_{curr_date}")
    prices_dir.mkdir(parents=True, exist_ok=True)
    op_sets = get_set_ids()

    logging.info(f"----------- Begin Download: {curr_date} -----------")
    for id in op_sets:
        file_path = prices_dir / f"group_{id}.csv"
        csv_url = f"https://tcgcsv.com/tcgplayer/68/{id}/ProductsAndPrices.csv"

        if file_path.exists():
            logging.warning(f"CSV {file_path} already exists. Skipping.")
            continue

        try:
            response = requests.get(csv_url)
            response.raise_for_status()

            with open(file_path, "wb") as f:
                f.write(response.content)

            logging.info(f"Downloaded CSV: {file_path}")

        except Exception as e:
            logging.error(f"Failed to download CSV for {id}")
    logging.info("----------- Finish Download -----------")


if __name__ == "__main__":
    database = connect_psql()
    df = pd.read_sql('one_piece_sets', con=database)

    get_csvs()

