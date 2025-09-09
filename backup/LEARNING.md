🟢 Beginner / Core Skills
These help you get comfortable with common DataFrame operations:

    Summarize prices
        Average, median, min/max card price across the whole dataset.
        Group by set and get price stats per set.

    Sort and filter
        Show the top 10 most expensive cards.

        Show cards under a certain price (e.g., budget options under $1).

    String manipulation
        Standardize or clean up card names (e.g., remove symbols, fix casing).

        Extract parts of a string (e.g., rarity or set code from name or ID).

    Deduplication
        Find and remove duplicate rows (maybe from repeated daily CSVs).

        Identify cards with the same name but different group IDs.

🟡 Intermediate / Grouping + Time Series
Get more practice with more "relational" and temporal thinking:

    GroupBy analysis
        Group by set or card type to see total number of cards, average prices, etc.

        Count how many cards exist per set or per rarity.

    Price trend analysis (once you have daily history)
        Calculate daily price change per card.

        Identify cards with the most volatility over the last week/month.

        Rolling average price for smoother trendlines (e.g., 7-day average).

    Track new cards
        Identify cards that were newly added in today’s CSV compared to yesterday.

🔵 Advanced / Modeling & Inference
Challenge yourself a bit more with modeling, merging, and prediction:

    Card rarity inference
        Try to guess card rarity based on price or inclusion in sets (clustering or rule-based).

    Deck value analysis
        Given a deck of cards (list of groupIds), calculate:

            Current value of the deck

            Value 7 days ago

            % change

    Simulate market movement
        If you pretend each deck is a portfolio, simulate how its value changes over time.

💡 Project Mini-Challenges

Great for portfolio or self-testing:

    Daily Card Report Generator
        A Python script that compares today’s prices vs. yesterday and outputs:

            Top 5 risers

            Top 5 fallers

            Cards that hit all-time highs

    Set Summary Dashboard
        A command-line (or Jupyter) dashboard that, for each set, prints:
            # of cards

            Average price

            Most expensive / cheapest card

    Rarity Estimator
        If rarity isn’t provided, use price percentiles within a set to guess which cards are Common, Rare, etc.