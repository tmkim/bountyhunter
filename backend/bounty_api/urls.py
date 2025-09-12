from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
# from .views import CustomTokenObtainPairView, ItemViewSet, ImageViewSet, SelectOptionViewSet
from .views import OnePieceSetViewSet, OnePieceCardViewSet, OnePieceCardHistoryViewSet, OnePieceDeckViewSet, OnePieceDeckCardViewSet


# Create a router and register our ViewSets with it.
router = DefaultRouter()
router.register(r'onepiece_set', OnePieceSetViewSet, basename='onepiece_set')
router.register(r'onepiece_card', OnePieceCardViewSet, basename='onepiece_card')
router.register(r'onepiece_cardhistory', OnePieceCardHistoryViewSet, basename='onepiece_cardhistory')
router.register(r'onepiece_deck', OnePieceDeckViewSet, basename='onepiece_deck')
router.register(r'onepiece_deckcard', OnePieceDeckCardViewSet, basename='onepiece_deckcard')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]
