import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, DateTime, ForeignKeyConstraint, Index, PrimaryKeyConstraint, String, Text, Integer, Float, ForeignKey
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
    foil_type = Column(String, default="Normal")
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

    __table_args__ = (
        Index('ix_card_cardid_foil', 'card_id', 'foil_type'),
        Index('ix_card_color', 'color'),
        Index('ix_card_card_type', 'card_type'),
        Index('ix_card_cost', 'cost'),
        Index('ix_card_power', 'power'),
        Index('ix_card_counter', 'counter'),
    )

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

    __tableargs__ = (
        Index('ix_card_history_id', 'id'),
        Index('ix_card_history_card_id', 'card_id')
    )

class OnePieceDeck(Base):
    __tablename__ = "one_piece_deck"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable = False)
    user = Column(String, nullable = False)

    cards = relationship("OnePieceDeckCard", back_populates="deck", cascade="all, delete-orphan")

    __tableargs__ = (
        Index('ix_deck_user', 'user'),
    )


class OnePieceDeckCard(Base):
    __tablename__ = "one_piece_deck_card"

    deck_id = Column(String, ForeignKey('one_piece_deck.id'), primary_key=True, nullable=False)
    card_id = Column(String, ForeignKey('one_piece_card.id'), primary_key=True, nullable=False)
    card_foil = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    deck = relationship("OnePieceDeck", back_populates="cards")
    card = relationship("OnePieceCard", back_populates="decks")