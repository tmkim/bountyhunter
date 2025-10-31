from rest_framework import serializers
from .models import OnePieceSet, OnePieceCard, OnePieceCardHistory, OnePieceDeck, OnePieceDeckCard
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "confirm_password")

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_active=False,  # 🔒 inactive until verified
        )
        return user

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