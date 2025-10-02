import os
import json
from pathlib import Path
import numpy as np
import pandas as pd
from datetime import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from bounty_api.models import OnePieceCard, OnePieceCardHistory

HISTORY_SCHEMA = {
    "product_id":   {"dtype": "int64",   "default": 0},
    "foil_type":    {"dtype": "string",  "default": "Normal"},
    "market_price": {"dtype": "float64", "default": 0.0},
}

class Command(BaseCommand):
    help = "Import historical price data from JSON directories into OnePieceCardHistory"

    def clean_df(self, df: pd.DataFrame) -> pd.DataFrame:
        # Ensure all expected columns exist
        df = df.reindex(columns=HISTORY_SCHEMA.keys())

        # Replace common string-nulls
        df = df.replace(to_replace=["nan", "NaN", "NaT", "NULL", "None"], value=np.nan)

        for col, spec in HISTORY_SCHEMA.items():
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
        base_dir = Path('prices/prev')

        if not os.path.isdir(base_dir):
            self.stderr.write(self.style.ERROR(f"{base_dir} is not a valid directory"))
            return

        # Load card reference once
        cards = OnePieceCard.objects.all().values("id", "product_id", "foil_type")
        df_cards = pd.DataFrame.from_records(cards)

        total_inserted = 0

        for folder in sorted(os.listdir(base_dir)):
            inserted_for_date = 0
            folder_path = os.path.join(base_dir, folder)
            if not os.path.isdir(folder_path):
                continue

            # Try parsing folder name as date (YYYY-MM-DD)
            try:
                history_date = datetime.strptime(folder, "%Y-%m-%d").date()
            except ValueError:
                self.stdout.write(self.style.WARNING(f"Skipping {folder}: not a valid date folder"))
                continue

            # Process each JSON file in this folder
            for dir_path in os.listdir(folder_path):
                fname = os.path.join(dir_path, 'prices')
                fpath = os.path.join(folder_path, fname)
                try:
                    with open(fpath, "r") as f:
                        raw_data = json.load(f)
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"Failed to load {fpath}: {e}"))
                    continue
                df_prices = pd.DataFrame(raw_data.get("results", []))
                if df_prices.empty:
                    self.stdout.write(f"Skipping empty file {fpath}")
                    continue

                # Keep relevant fields
                df_prices = df_prices[['productId','subTypeName','marketPrice']]
                df_prices = df_prices.rename(columns={
                    "productId": "product_id",
                    "subTypeName": "foil_type",
                    "marketPrice": "market_price"
                })

                # Ensure numeric
                # df_prices["market_price"] = pd.to_numeric(df_prices["market_price"], errors="coerce")
                df_prices = self.clean_df(df_prices)

                # Merge with card table
                merged = df_prices.merge(
                    df_cards,
                    on=["product_id", "foil_type"],
                    how="inner",
                )

                # Deduplicate just in case
                merged = merged.drop_duplicates(subset=["id", "product_id", "foil_type", "market_price"])

                # Convert to model instances
                history_objs = [
                    OnePieceCardHistory(
                        card_id=row["id"],
                        history_date=history_date,
                        market_price=row["market_price"],
                    )
                    for _, row in merged.iterrows()
                ]

                if not history_objs:
                    self.stdout.write(f"No matching rows found in {fpath}")
                    continue

                with transaction.atomic():
                    OnePieceCardHistory.objects.bulk_create(
                        history_objs, ignore_conflicts=True, batch_size=5000
                    )

                inserted_for_date += len(history_objs)
                total_inserted += len(history_objs)
                # self.stdout.write(self.style.SUCCESS(f"Inserted {len(history_objs)} rows from {fpath}"))

            # --- fill in missing cards (those not in JSONs) ---
            existing_card_ids = OnePieceCardHistory.objects.filter(
                history_date=history_date
            ).values_list("card_id", flat=True)

            missing_cards = OnePieceCard.objects.exclude(id__in=existing_card_ids)

            filler_objs = [
                OnePieceCardHistory(
                    card_id=c.id,
                    history_date=history_date,
                    market_price=c.market_price or 0,  # fall back to current card value
                )
                for c in missing_cards
            ]

            if filler_objs:
                with transaction.atomic():
                    OnePieceCardHistory.objects.bulk_create(
                        filler_objs, ignore_conflicts=True, batch_size=5000
                    )
                inserted_for_date += len(filler_objs)

            total_inserted += inserted_for_date
            self.stdout.write(f"Inserted {inserted_for_date} rows for {history_date}")

        self.stdout.write(self.style.SUCCESS(f"Done! Inserted total {total_inserted} rows."))
