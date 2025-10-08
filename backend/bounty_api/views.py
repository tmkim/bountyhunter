from rest_framework import viewsets
from .models import OnePieceSet, OnePieceCard, OnePieceCardHistory, OnePieceDeck, OnePieceDeckCard
from .serializers import OnePieceSetSerializer, OnePieceCardSerializer, OnePieceCardHistorySerializer, OnePieceDeckSerializer, OnePieceDeckCardSerializer
# from django.shortcuts import render

# Create your views here.
class OnePieceSetViewSet(viewsets.ModelViewSet):
    queryset = OnePieceSet.objects.all()
    serializer_class = OnePieceSetSerializer

class OnePieceCardViewSet(viewsets.ModelViewSet):
    queryset = OnePieceCard.objects.all()
    serializer_class = OnePieceCardSerializer

# class OnePieceCardHistoryViewSet(viewsets.ModelViewSet):
#     queryset = OnePieceCardHistory.objects.all()
#     serializer_class = OnePieceCardHistorySerializer

class OnePieceCardHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OnePieceCardHistory.objects.all()
    serializer_class = OnePieceCardHistorySerializer

    def get_queryset(self):
        card_id = self.request.query_params.get("card_id")
        if card_id:
            return self.queryset.filter(card_id=card_id).order_by("history_date")
        return self.queryset.none()
        # return self.queryset.all() //for debug

class OnePieceDeckViewSet(viewsets.ModelViewSet):
    queryset = OnePieceDeck.objects.all()
    serializer_class = OnePieceDeckSerializer

class OnePieceDeckCardViewSet(viewsets.ModelViewSet):
    queryset = OnePieceDeckCard.objects.all()
    serializer_class = OnePieceDeckCardSerializer

