import requests
import os
import pandas as pd
from pathlib import Path
from setup.db_connect import connect_psql

def download_csv(file_path: Path):

    # Download CSV
    response = requests.get("https://tcgcsv.com/tcgplayer/68/Groups.csv")
    if response.status_code == 200:
        with open(file_path, "wb") as f:
            f.write(response.content)
        print (f"Downloaded to: {file_path}")
    else:
        print(f"Failed to download CSV: {response.status_code}")
        return None 
    
    return file_path

def load_and_clean_csv(file_path: Path) -> pd.DataFrame:
    # Load CSV
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

    return df

def save_to_db(df, table_name):
    engine = connect_psql()
    df.to_sql(table_name, engine, if_exists="replace", index=False)
    engine.close()

if __name__ == "__main__":
    file_path = "one_piece_groups.csv"
    path = file_path if os.path.exists(file_path) else download_csv(file_path)

    try:
        clean_df = load_and_clean_csv(path)
        save_to_db(clean_df, "one_piece_card_set")

    except Exception as e:
        print(f"Error: {e}")