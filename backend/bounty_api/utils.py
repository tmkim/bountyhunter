from django.core.signing import dumps
from django.conf import settings

def generate_verification_link(user):
    token = dumps({"user_id": user.id})
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    return f"{frontend_url}/verify-email?token={token}"
