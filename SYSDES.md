Okay so let's take some time to plan out this project.

What are the goals of our system?
- Daily download of One Piece card prices from tcgcsv.com
- Use Pandas to clean data and upload to database
    > main table will have current price
    > history table for price history

- Able to look up a card
    > display card info
    > display current price
    > display price history

- Able to build a deck of cards
    > can add/remove cards from active deck
    > save deck for easy retrieval in the future
    > can build without login, need login to save
    > enforce deck building restrictions

    + Able to view deck of cards
        > display total value
        > display total value history
        > display list of included cards

What tables will we need?
- User table
- Sets table (keep track of existing card sets)
- Bounty table (keep track of card info, prices)
- Decks table (keep track of pre-made decks, group by user)
    + future - keep track of recommended/meta decks
- Deck_Cards table (many-to-many join table between Decks and Bounties)
- OPTIONAL : Deck_Value_History table (track historical data for decks)

What APIs will I need?
- GET /user

- GET /api/cards
- GET /api/cards/:id
- GET /api/cards/:id/history

- GET /api/decks/:id — view a deck
- GET /api/decks?user_id=... — get all decks by a user (if logged in)
- POST /api/decks — create a deck
- PUT /api/decks/:id — update cards in deck
- DELETE /api/decks/:id — delete a deck
- POST /api/decks/:id/cards — add card to deck
- DELETE /api/decks/:id/cards/:card_id — remove card from deck

Daily script:
- Downloads CSVs from tcgcsv
- Check if today’s price is different from yesterday
- If changed or new, updates the bounty table (latest)
- Always inserts a row into price_history for today if it hasn’t already
