import logging
from datetime import datetime
from pathlib import Path
import numpy as np
import pandas as pd
import requests
import io

from django.core.management.base import BaseCommand
from django.db import transaction

from bounty_api.models import OnePieceSet, OnePieceCard, OnePieceCardHistory 

# Setup log dir
log_dir = Path("logs")
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"get_tcgcsv_{datetime.now().strftime('%Y-%m-%d')}.log"

logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

CARD_SCHEMA = {
    "product_id":   {"dtype": "int64",   "default": 0},
    "foil_type":    {"dtype": "string",  "default": "Normal"},
    "name":         {"dtype": "string",  "default": ""},
    "image_url":    {"dtype": "string",  "default": None},
    "tcgplayer_url":{"dtype": "string",  "default": None},
    "market_price": {"dtype": "float64", "default": 0.0},
    "rarity":       {"dtype": "string",  "default": None},
    "card_id":      {"dtype": "string",  "default": None},
    "description":  {"dtype": "string",  "default": None},
    "color":        {"dtype": "string",  "default": None},
    "card_type":    {"dtype": "string",  "default": None},
    "life":         {"dtype": "int64",   "default": 0},
    "power":        {"dtype": "int64",   "default": 0},
    "subtype":      {"dtype": "string",  "default": None},
    "attribute":    {"dtype": "string",  "default": None},
    "cost":         {"dtype": "int64",   "default": 0},
    "counter":      {"dtype": "int64",   "default": 0}
}

class Command(BaseCommand):
    help = "ETL pipeline for TCGCSV data into Django models"

    def clean_df(self, df: pd.DataFrame) -> pd.DataFrame:
        # Ensure all expected columns exist
        df = df.reindex(columns=CARD_SCHEMA.keys())

        # Replace common string-nulls
        df = df.replace(to_replace=["nan", "NaN", "NaT", "NULL", "None"], value=np.nan)

        for col, spec in CARD_SCHEMA.items():
            dtype = spec["dtype"]
            default = spec["default"]

            if dtype == "int64":
                df[col] = pd.to_numeric(df[col], errors="coerce").dropna().astype("int64")
                if default is not None:
                    df[col] = df[col].fillna(default)

            elif dtype == "float64":
                df[col] = pd.to_numeric(df[col], errors="coerce").astype("float64")
                if default is not None:
                    df[col] = df[col].fillna(default)

            else:  # string-like
                df[col] = df[col].astype("string")
                if default is not None:
                    df[col] = df[col].fillna(default)

        return df


    def handle(self, *args, **options):
        try:
            set_ids = self.get_set_ids()
            csv_dir = self.get_csvs(set_ids)
            self.csv_etl(csv_dir)
            self.stdout.write(self.style.SUCCESS("ETL Complete!"))
        except Exception as e:
            logging.error(f"ETL error: {e}")
            self.stderr.write(self.style.ERROR(f"ETL error: {e}"))

    def get_set_ids(self):
        print("Downloading set list...")
        url = "https://tcgcsv.com/tcgplayer/68/Groups.csv"
        logging.info("Downloading set list...")
        response = requests.get(url)
        response.raise_for_status()

        df = pd.read_csv(io.StringIO(response.text))
        db_set_ids = set(OnePieceSet.objects.values_list("id", flat=True))

        if len(db_set_ids) != len(df):
            logging.info("New set(s) found, updating CardSet table...")
            for _, row in df.iterrows():
                OnePieceSet.objects.update_or_create(
                    id=row["groupId"],
                    defaults={
                        "name": row["abbreviation"].replace(" ", "_"),
                        "description": row["name"],
                    }
                )
        print("Set list up to date")

        return list(OnePieceSet.objects.values_list("id", flat=True))

    def get_csvs(self, set_list):
        print("Fetching most recent price lists")
        # curr_date = '2025-09-24'
        curr_date = datetime.today().strftime("%Y-%m-%d")
        prices_dir = Path("prices") / curr_date
        prices_dir.mkdir(parents=True, exist_ok=True)

        for count, set_id in enumerate(set_list):
            file_path = prices_dir / f"group_{set_id}.csv"
            csv_url = f"https://tcgcsv.com/tcgplayer/68/{set_id}/ProductsAndPrices.csv"
            print(f"\rLoading CSV: {file_path} ({count+1}/{len(set_list)})", end='', flush=True)

            if file_path.exists():
                logging.info(f"CSV already exists: {file_path}")
                continue

            try:
                response = requests.get(csv_url)
                response.raise_for_status()
                with open(file_path, "wb") as f:
                    f.write(response.content)
                logging.info(f"Downloaded {file_path}")
            except Exception as e:
                logging.error(f"Error downloading {set_id}: {e}")
        print()

        print("... Complete!")

        return prices_dir

    @transaction.atomic
    def csv_etl(self, csv_dir: Path):
        EXPECTED_INPUT = [
            "productId", "name", "imageUrl", "url", "marketPrice",
            "subTypeName", "extRarity", "extNumber", "extDescription", "extColor",
            "extCardType", "extLife", "extPower", "extSubtypes",
            "extAttribute", "extCost", "extCounterplus"
        ]

        # curr_date = '2025-09-24'
        curr_date = datetime.now()
        csv_list = list(csv_dir.iterdir())
        df_list = []

        for file in csv_list:
            df = pd.read_csv(file)
            for col in EXPECTED_INPUT:
                if col not in df.columns:
                    df[col] = pd.NA

            df = df.rename(columns={
                "productId": "product_id",
                "name": "name",
                "imageUrl": "image_url",
                "url": "tcgplayer_url",
                "marketPrice": "market_price",
                "subTypeName": "foil_type",
                "extRarity": "rarity",
                "extNumber": "card_id",
                "extDescription": "description",
                "extColor": "color",
                "extCardType": "card_type",
                "extLife": "life",
                "extPower": "power",
                "extSubtypes": "subtype",
                "extAttribute": "attribute",
                "extCost": "cost",
                "extCounterplus": "counter",
            })
            df_list.append(self.clean_df(df))

        print("Dataframe cleaning complete")
        logging.info("Dataframe cleaning complete")
        df_all = pd.concat(df_list, ignore_index=True)
        
        # Separate new vs existing cards
        existing_pairs = set(
            OnePieceCard.objects.values_list("product_id", "foil_type")
        )
        new_rows = df_all[
            ~df_all.apply(lambda row: (row["product_id"], row["foil_type"]) in existing_pairs, axis=1)
        ]
        existing_rows = df_all[
            df_all.apply(lambda row: (row["product_id"], row["foil_type"]) in existing_pairs, axis=1)
        ]

        # Bulk-Create any new cards
        print("Bulk create")
        logging.info("Starting bulk insert for table one_piece_card")
        new_cards = [
            OnePieceCard(
                product_id=row["product_id"],
                foil_type=row["foil_type"],
                name=row["name"],
                image_url=row["image_url"],
                tcgplayer_url=row["tcgplayer_url"],
                market_price=row["market_price"] or 0,
                rarity=row["rarity"],
                card_id=row["card_id"],
                description=row["description"],
                color=row["color"],
                card_type=row["card_type"],
                life=row["life"] if pd.notna(row["life"]) else None,
                power=row["power"] if pd.notna(row["power"]) else None,
                subtype=row["subtype"],
                attribute=row["attribute"],
                cost=row["cost"] if pd.notna(row["cost"]) else None,
                counter=row["counter"] if pd.notna(row["counter"]) else None,
                last_update=curr_date,
            )
            for _, row in new_rows.iterrows()
        ]
        OnePieceCard.objects.bulk_create(new_cards, batch_size=1000)
        print(f"Inserted {len(new_cards)} new cards,")
        logging.info(f"Inserted {len(new_cards)} new cards")

        # Bulk-Update existing cards
        print("Bulk update")
        logging.info("Starting bulk update for table one_piece_card")
        existing_cards = {
            (c.product_id, c.foil_type): c
            for c in OnePieceCard.objects.filter(
                product_id__in=existing_rows["product_id"].unique(),
                foil_type__in=existing_rows["foil_type"].unique()
            ).exclude(last_update=curr_date)
        }

        to_update = []
        for _, row in existing_rows.iterrows():
            card = existing_cards.get((row["product_id"], row["foil_type"]))
            if not card:
                continue  # safety check

            card.name = row["name"]
            card.image_url = row["image_url"]
            card.tcgplayer_url = row["tcgplayer_url"]
            card.market_price = row["market_price"] or 0
            card.rarity = row["rarity"]
            card.card_id = row["card_id"]
            card.description = row["description"]
            card.color = row["color"]
            card.card_type = row["card_type"]
            card.life = row["life"] if pd.notna(row["life"]) else None
            card.power = row["power"] if pd.notna(row["power"]) else None
            card.subtype = row["subtype"]
            card.attribute = row["attribute"]
            card.cost = row["cost"] if pd.notna(row["cost"]) else None
            card.counter = row["counter"] if pd.notna(row["counter"]) else None
            card.last_update = curr_date
            to_update.append(card)

        OnePieceCard.objects.bulk_update(
            to_update,
            fields=[
                "name", "image_url", "tcgplayer_url",
                "market_price", "rarity", "card_id", "description", "color",
                "card_type", "life", "power", "subtype", "attribute", "cost",
                "counter", "last_update"
            ],
            batch_size=1000,
        )

        # Update last_update for any cards that were not included in CSVs
        OnePieceCard.objects.exclude(last_update=curr_date).update(last_update=curr_date)

        print(f"updated {len(to_update)} existing cards,")
        logging.info(f"updated {len(to_update)} existing cards")

        # Bulk-Create history rows
        print("Bulk history")
        logging.info("Starting bulk insert for table one_piece_card_history")
        
        all_cards = OnePieceCard.objects.all()
        history_objs = [
            OnePieceCardHistory(
                card_id=card.id,
                history_date=curr_date,
                market_price=card.market_price or 0,
            )
            for card in all_cards
        ]
        OnePieceCardHistory.objects.bulk_create(history_objs, batch_size=1000, ignore_conflicts=True)

        added_count = all_cards.count()

        print(f"Inserted {added_count} history rows")
        logging.info(f"Inserted {added_count} history rows for {curr_date}")