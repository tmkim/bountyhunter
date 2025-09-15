import logging
from datetime import datetime
from pathlib import Path
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

class Command(BaseCommand):
    help = "ETL pipeline for TCGCSV data into Django models"

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

        csv_list = list(csv_dir.iterdir())
        df_list = []

        for file in csv_list:
            df = pd.read_csv(file)
            for col in EXPECTED_INPUT:
                if col not in df.columns:
                    df[col] = pd.NA

            df = df.rename(columns={
                "productId": "id",
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
            df_list.append(df)

        df_all = pd.concat(df_list, ignore_index=True)
        df["id"] = df["id"].astype(int)
        curr_date = datetime.now()

        ids = df_all["id"].tolist()
        existing_ids = set(OnePieceCard.objects.filter(id__in=ids).values_list("id", flat=True))

        for e in existing_ids:
            print(e)

        new_rows = df_all[~df_all["id"].isin(existing_ids)]
        existing_rows = df_all[df_all["id"].isin(existing_ids)]

        # Bulk-Create any new cards
        print("Bulk create")
        new_cards = [
            OnePieceCard(
                id=row["id"],
                name=row["name"],
                image_url=row["image_url"],
                tcgplayer_url=row["tcgplayer_url"],
                market_price=row["market_price"] or 0,
                foil_type=row["foil_type"],
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

        # Bulk-Update existing cards
        print("Bulk update")
        to_update = []
        for _, row in existing_rows.iterrows():
            card = OnePieceCard(
                id=row["id"],  # required for update
                name=row["name"],
                image_url=row["image_url"],
                tcgplayer_url=row["tcgplayer_url"],
                market_price=row["market_price"] or 0,
                foil_type=row["foil_type"],
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
            to_update.append(card)

        OnePieceCard.objects.bulk_update(
            to_update,
            fields=[
                "name", "image_url", "tcgplayer_url", "market_price", "foil_type",
                "rarity", "card_id", "description", "color", "card_type",
                "life", "power", "subtype", "attribute", "cost", "counter",
                "last_update",
            ],
            batch_size=1000
        )

        # Bulk-Create history rows
        print("Bulk history")
        history_objs = [
            OnePieceCardHistory(
                card_id=row["id"],
                name=row["name"],
                market_price=row["market_price"] or 0,
                foil_type=row["foil_type"],
                rarity=row["rarity"],
                card_type=row["card_type"],
                description=row["description"],
                history_date=curr_date,
            )
            for _, row in df_all.iterrows()
        ]
        OnePieceCardHistory.objects.bulk_create(history_objs, batch_size=1000)

        print(f"Inserted {len(new_cards)} new cards,")
        print(f"updated {len(to_update)} existing cards,")
        print(f"added {len(history_objs)} history rows")


        # for count, file in enumerate(csv_list):
        #     print(f"\rLoading CSV: {file} ({count+1}/{len(csv_list)})", end='', flush=True)
        #     df = pd.read_csv(file)
        #     for col in EXPECTED_INPUT:
        #         if col not in df.columns:
        #             df[col] = pd.NA

        #     df = df.rename(columns={
        #         "productId": "id",
        #         "name": "name",
        #         "imageUrl": "image_url",
        #         "url": "tcgplayer_url",
        #         "marketPrice": "market_price",
        #         "subTypeName": "foil_type",
        #         "extRarity": "rarity",
        #         "extNumber": "card_id",
        #         "extDescription": "description",
        #         "extColor": "color",
        #         "extCardType": "card_type",
        #         "extLife": "life",
        #         "extPower": "power",
        #         "extSubtypes": "subtype",
        #         "extAttribute": "attribute",
        #         "extCost": "cost",
        #         "extCounterplus": "counter"
        #     })

        #     curr_date = datetime.today()
        #     for _, row in df.iterrows():
        #         card, created = OnePieceCard.objects.update_or_create(
        #             id=row["id"],
        #             defaults={
        #                 "name": row["name"],
        #                 "image_url": row["image_url"],
        #                 "tcgplayer_url": row["tcgplayer_url"],
        #                 "market_price": row["market_price"] or 0,
        #                 "foil_type": row["foil_type"],
        #                 "rarity": row["rarity"],
        #                 "card_id": row["card_id"],
        #                 "description": row["description"],
        #                 "color": row["color"],
        #                 "card_type": row["card_type"],
        #                 "life": row["life"] if pd.notna(row["life"]) else None,
        #                 "power": row["power"] if pd.notna(row["power"]) else None,
        #                 "subtype": row["subtype"],
        #                 "attribute": row["attribute"],
        #                 "cost": row["cost"] if pd.notna(row["cost"]) else None,
        #                 "counter": row["counter"] if pd.notna(row["counter"]) else None,
        #                 "last_update": curr_date,
        #             }
        #         )
        #         OnePieceCardHistory.objects.create(
        #             card=card,
        #             history_date=curr_date,
        #             market_price=card.market_price
        #         )
