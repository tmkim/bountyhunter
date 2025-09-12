import uuid
from django.db import models


class OnePieceSet(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "one_piece_card_set"


class OnePieceCard(models.Model):
    id = models.CharField(primary_key=True, max_length=255)
    name = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, null=True)
    tcgplayer_url = models.URLField(blank=True, null=True)
    market_price = models.FloatField(blank=True, null=True)
    foil_type = models.CharField(max_length=50, default="Normal")
    rarity = models.CharField(max_length=50, blank=True, null=True)
    card_id = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    card_type = models.CharField(max_length=50, blank=True, null=True)
    life = models.IntegerField(blank=True, null=True)
    power = models.IntegerField(blank=True, null=True)
    subtype = models.CharField(max_length=100, blank=True, null=True)
    attribute = models.CharField(max_length=50, blank=True, null=True)
    cost = models.IntegerField(blank=True, null=True)
    counter = models.IntegerField(blank=True, null=True)
    last_update = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "one_piece_card"
        indexes = [
            models.Index(fields=["card_id", "foil_type"], name="ix_card_cardid_foil"),
            models.Index(fields=["color"], name="ix_card_color"),
            models.Index(fields=["card_type"], name="ix_card_card_type"),
            models.Index(fields=["cost"], name="ix_card_cost"),
            models.Index(fields=["power"], name="ix_card_power"),
            models.Index(fields=["counter"], name="ix_card_counter"),
        ]


class OnePieceCardHistory(models.Model):
    index = models.AutoField(primary_key=True)
    id = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, null=True)
    tcgplayer_url = models.URLField(blank=True, null=True)
    market_price = models.FloatField(blank=True, null=True)
    foil_type = models.CharField(max_length=50, blank=True, null=True)
    rarity = models.CharField(max_length=50, blank=True, null=True)
    card_id = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    card_type = models.CharField(max_length=50, blank=True, null=True)
    life = models.IntegerField(blank=True, null=True)
    power = models.IntegerField(blank=True, null=True)
    subtype = models.CharField(max_length=100, blank=True, null=True)
    attribute = models.CharField(max_length=50, blank=True, null=True)
    cost = models.IntegerField(blank=True, null=True)
    counter = models.IntegerField(blank=True, null=True)
    history_date = models.DateTimeField()

    class Meta:
        db_table = "one_piece_card_history"
        indexes = [
            models.Index(fields=["id"], name="ix_card_history_id"),
            models.Index(fields=["card_id"], name="ix_card_history_card_id"),
        ]


class OnePieceDeck(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    leader = models.CharField(max_length=255)
    user = models.CharField(max_length=255)

    class Meta:
        db_table = "one_piece_deck"
        indexes = [
            models.Index(fields=["user"], name="ix_deck_user"),
            models.Index(fields=["leader"], name="ix_deck_leader"),
        ]


class OnePieceDeckCard(models.Model):
    deck = models.ForeignKey(
        OnePieceDeck, on_delete=models.CASCADE, related_name="cards"
    )
    card = models.ForeignKey(
        OnePieceCard, on_delete=models.CASCADE, related_name="decks"
    )
    card_foil = models.CharField(max_length=50)
    quantity = models.IntegerField(default=1)

    class Meta:
        db_table = "one_piece_deck_card"
        unique_together = ("deck", "card")  # composite PK equivalent
