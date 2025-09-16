import uuid
from django.db import models


class OnePieceSet(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "one_piece_set"

class OnePieceCard(models.Model):
    product_id = models.IntegerField(default=0)
    foil_type = models.CharField(max_length=50, default="Normal")

    name = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, null=True)
    tcgplayer_url = models.URLField(blank=True, null=True)
    market_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    rarity = models.CharField(max_length=100, blank=True, null=True)
    card_id = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    card_type = models.CharField(max_length=100, blank=True, null=True)
    life = models.IntegerField(blank=True, null=True)
    power = models.IntegerField(blank=True, null=True)
    subtype = models.CharField(max_length=255, blank=True, null=True)
    attribute = models.CharField(max_length=50, blank=True, null=True)
    cost = models.IntegerField(blank=True, null=True)
    counter = models.IntegerField(blank=True, null=True)

    last_update = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("product_id", "foil_type")
        db_table = "one_piece_card"

    def __str__(self):
        return f"{self.name} ({self.foil_type or 'Normal'})"


class OnePieceCardHistory(models.Model):
    card = models.ForeignKey(OnePieceCard, on_delete=models.CASCADE, related_name="history")
    history_date = models.DateField()
    market_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        unique_together = ("card", "history_date")
        db_table = "one_piece_card_history"

    def __str__(self):
        return f"{self.card} on {self.history_date} - {self.market_price}"


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
