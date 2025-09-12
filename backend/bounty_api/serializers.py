from rest_framework import serializers
from .models import OnePieceSet, OnePieceCard, OnePieceCardHistory, OnePieceDeck, OnePieceDeckCard

class OnePieceSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnePieceSet
        fields = '__all__'
        
class OnePieceCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnePieceCard
        fields = '__all__'
        
class OnePieceCardHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OnePieceCardHistory
        fields = '__all__'
        
class OnePieceDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnePieceDeck
        fields = '__all__'
        
class OnePieceDeckCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnePieceDeckCard
        fields = '__all__'