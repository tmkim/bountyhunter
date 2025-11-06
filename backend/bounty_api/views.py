from rest_framework import viewsets, generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import OnePieceSet, OnePieceCard, OnePieceCardHistory, OnePieceDeck
# , OnePieceDeckCard
from .serializers import RegisterSerializer, OnePieceSetSerializer, OnePieceCardSerializer, \
                         OnePieceCardHistorySerializer, OnePieceDeckSerializer
# , OnePieceDeckCardSerializer
from .utils import generate_verification_link

from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import BadSignature, SignatureExpired, loads
from django.contrib.auth import get_user_model
from django.utils import timezone


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
        token = request.GET.get('token')
        if not token:
            return Response({'detail': 'Missing token.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data = loads(token, max_age=60*60*24)  # 24-hour expiry
            user_id = data.get('user_id')
            user = User.objects.get(id=user_id)
            user.is_active = True
            user.email_verified_at = timezone.now()
            user.save()
            return Response({'detail': 'Email verified successfully!'}, status=status.HTTP_200_OK)

        except SignatureExpired:
            return Response({'detail': 'Token has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        except (BadSignature, User.DoesNotExist):
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)

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
    serializer_class = OnePieceDeckSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return decks belonging to the current user
        return OnePieceDeck.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically associate the deck with the logged-in user
        serializer.save(user=self.request.user)

# class OnePieceDeckCardViewSet(viewsets.ModelViewSet):
#     queryset = OnePieceDeckCard.objects.all()
#     serializer_class = OnePieceDeckCardSerializer
