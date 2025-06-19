from sqlalchemy import Column, DateTime, ForeignKeyConstraint, PrimaryKeyConstraint, String, Text, Integer, Float, ForeignKey
from sqlalchemy.ext.declarative  import declarative_base
from sqlalchemy.orm import relationship
import pandas as pd

Base = declarative_base()

class OnePieceSet(Base):
    __tablename__ = "one_piece_card_set"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)

class OnePieceCard(Base):
    __tablename__ = "one_piece_card"

    id = Column(String, primary_key=True, nullable=False)
    name = Column(String, nullable = False)
    image_url = Column(String)
    tcgplayer_url = Column(String)
    market_price = Column(Float)
    foil_type = Column(String)
    rarity = Column(String)
    card_id = Column(String)
    description = Column(String)
    color = Column(String)
    card_type = Column(String)
    life = Column(Integer)
    power = Column(Integer)
    subtype = Column(String)
    attribute = Column(String)
    cost = Column(Integer)
    counter = Column(Integer)
    last_update = Column(DateTime, default=pd.Timestamp.now)

    decks = relationship("OnePieceDeckCard", back_populates="card")

class OnePieceCardHistory(Base):
    __tablename__ = "one_piece_card_history"

    index = Column(Integer, primary_key=True, autoincrement=True)
    id = Column(String, nullable = False)
    name = Column(String, nullable = False)
    image_url = Column(String)
    tcgplayer_url = Column(String)
    market_price = Column(Float)
    foil_type = Column(String)
    rarity = Column(String)
    card_id = Column(String)
    description = Column(String)
    color = Column(String)
    card_type = Column(String)
    life = Column(Integer)
    power = Column(Integer)
    subtype = Column(String)
    attribute = Column(String)
    cost = Column(Integer)
    counter = Column(Integer)
    history_date = Column(DateTime)

    cards = relationship("OnePieceDeckCard", back_populates="deck")

class OnePieceDeck(Base):
    __tablename__ = "one_piece_deck"

    id = Column(String, primary_key = True)
    name = Column(String, nullable = False)
    user = Column(String, nullable = False)

class OnePieceDeckCard(Base):
    __tablename__ = "one_piece_deck_card"

    deck_id = Column(String, ForeignKey('one_piece_deck.id'), primary_key=True, nullable=False)
    card_id = Column(String, ForeignKey('one_piece_card.id'), primary_key=True, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    deck = relationship("OnePieceDeck", back_populates="cards")
    card = relationship("OnePieceCard", back_populates="decks")