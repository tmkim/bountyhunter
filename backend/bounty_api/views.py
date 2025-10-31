from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import OnePieceSet, OnePieceCard, OnePieceCardHistory, OnePieceDeck, OnePieceDeckCard
from .serializers import RegisterSerializer, OnePieceSetSerializer, OnePieceCardSerializer, \
                         OnePieceCardHistorySerializer, OnePieceDeckSerializer, OnePieceDeckCardSerializer
from .utils import generate_verification_link, signer
from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import BadSignature
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        verification_link = generate_verification_link(user)
        
        # For now, just print it to console for testing
        print("Verification link:", verification_link)

        # Later: send_mail(
        #     "Verify your account",
        #     f"Click here to verify your account: {verification_link}",
        #     settings.DEFAULT_FROM_EMAIL,
        #     [user.email],
        # )

        return user

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Registration successful. Please check your email to verify your account."},
            status=status.HTTP_201_CREATED,
        )
    
class VerifyEmailView(APIView):
    def get(self, request):
        token = request.query_params.get("token")
        try:
            user_id = signer.unsign(token)
            user = User.objects.get(pk=user_id)
            if user.is_active:
                return Response({"message": "Account already verified."})
            user.is_active = True
            user.save()
            return Response({"message": "Account verified successfully!"})
        except (BadSignature, User.DoesNotExist):
            return Response({"error": "Invalid or expired token."}, status=400)

class OnePieceSetViewSet(viewsets.ModelViewSet):
    queryset = OnePieceSet.objects.all()
    serializer_class = OnePieceSetSerializer

class OnePieceCardViewSet(viewsets.ModelViewSet):
    queryset = OnePieceCard.objects.all()
    serializer_class = OnePieceCardSerializer

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

