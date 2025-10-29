from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

def set_tokens_as_cookies(response, refresh, access):
    response.set_cookie(
        key="refresh",
        value=str(refresh),
        httponly=True,
        secure=True,
        samesite="None",
        path="/api/auth/",
    )
    response.set_cookie(
        key="access",
        value=str(access),
        httponly=True,
        secure=True,
        samesite="None",
        path="/api/auth/",
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)
    user = User.objects.create_user(username=username, password=password)
    return Response({'message': 'User created successfully'}, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=400)
    
    refresh = RefreshToken.for_user(user)
    response = Response({'message': 'Login successful'})
    set_tokens_as_cookies(response, refresh, refresh.access_token)
    return response

@api_view(['POST'])
def logout(request):
    refresh_token = request.COOKIES.get('refresh')
    response = Response({'message': 'Logout successful'})
    response.delete_cookie('access', path="/api/auth/")
    response.delete_cookie('refresh', path="/api/auth/")
    
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass  # token might already be invalid

    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    return Response({'username': user.username})

# Cookie-based auth below 

@api_view(["POST"])
@permission_classes([AllowAny])
def cookie_login_view(request):
    from django.contrib.auth import authenticate

    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"detail": "Invalid credentials"}, status=400)

    refresh = RefreshToken.for_user(user)
    res = Response({"detail": "Login successful"})
    res.set_cookie(
        key="access",
        value=str(refresh.access_token),
        httponly=True,
        secure=False,  # change to True in production (HTTPS only)
        samesite="Lax",
        max_age=60 * 5,  # access token lifetime
    )
    res.set_cookie(
        key="refresh",
        value=str(refresh),
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=60 * 60 * 24,  # refresh token lifetime
    )
    return res

@api_view(["POST"])
def cookie_logout_view(request):
    res = Response({"detail": "Logout successful"})
    res.delete_cookie("access")
    res.delete_cookie("refresh")
    return res

@api_view(["POST"])
@permission_classes([AllowAny])
def cookie_refresh_view(request):
    from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
    from rest_framework_simplejwt.exceptions import TokenError

    refresh_token = request.COOKIES.get("refresh")
    if not refresh_token:
        return Response({"detail": "No refresh token"}, status=400)

    try:
        refresh = RefreshToken(refresh_token)
        new_access = refresh.access_token
        res = Response({"detail": "Token refreshed"})
        res.set_cookie(
            key="access",
            value=str(new_access),
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=60 * 5,
        )
        return res
    except TokenError:
        return Response({"detail": "Invalid refresh token"}, status=401)
