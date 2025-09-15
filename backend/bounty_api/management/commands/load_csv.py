import pandas as pd
from django.core.management.base import BaseCommand
from bounty_api.models import Item  # change to your model(s)

class Command(BaseCommand):
    help = "ETL pipeline: load CSV into DB"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str, help="Path to the CSV file")

    def handle(self, *args, **options):
        csv_file = options["csv_file"]

        # Extract
        self.stdout.write(self.style.NOTICE(f"Reading {csv_file}..."))
        df = pd.read_csv(csv_file)

        # Transform (basic cleanup)
        df = df.rename(columns=lambda x: x.strip().lower())  # normalize column names
        df = df.drop_duplicates()
        df = df.fillna("")  # replace NaN with empty string

        # Example: ensure "name" column is title case
        if "name" in df.columns:
            df["name"] = df["name"].str.strip().str.title()

        # Load into DB
        created, updated = 0, 0
        for _, row in df.iterrows():
            obj, was_created = Item.objects.update_or_create(
                name=row["name"],  # unique identifier (adjust as needed)
                defaults={
                    "description": row.get("description", ""),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done! {created} created, {updated} updated."
        ))
