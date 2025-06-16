import os, requests
import pandas as pd
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# ONE_PIECE_GROUPS = [3188,3189,3190,3191,3192,17658,17659,17660,
#                     17661,17675,17687,17698,17699,22890,22930,
#                     22934,22956,22957,23024,23213,23232,23243,
#                     23250,23272,23297,23304,23333,23348,23349,
#                     23368,23387,23424,23462,23489,23490,23491,
#                     23492,23493,23494,23495,23496,23512,23589,
#                     23590,23737,23766,23834,23890,23907,23991,
#                     24068,24241,24242,24282,24283,24284,24285,
#                     24286,24287,24302,24303,24304,24305,24306]

ONE_PIECE_GROUPS = "one_piece_groups.csv"

def download_csv():
    curr_date = datetime.today().strftime("%Y-%m-%d")
    data_dir = Path(f"prices_{curr_date}")
    data_dir.mkdir(exist_ok=True)
    # file_path = data_dir / f"group_{GROUP_ID}.csv"
    file_path = data_dir / f"group_{ONE_PIECE_GROUPS[0]}.csv"

    # response = requests.get("https://tcgcsv.com/tcgplayer/68/GROUP_ID/ProductsAndPrices.csv")
    response = requests.get("https://tcgcsv.com/tcgplayer/68/3188/ProductsAndPrices.csv")
    if response.status_code == 200:
        with open(file_path, "wb") as f:
            f.write(response.content)
        print (f"Downloaded to: {file_path}")
    else:
        print(f"Failed to download CSV: {response.status_code}")
        return None 
    
    return file_path 

def preview_csv(file_path):
    df = pd.read_csv(file_path)
    print(df.head())
    print(df.columns)

if __name__ == "__main__":
    path = download_csv()
    if path:
        preview_csv(path)