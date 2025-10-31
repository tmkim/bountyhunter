from django.core.signing import Signer
from django.conf import settings

signer = Signer()

def generate_verification_link(user):
    token = signer.sign(user.pk)
    return f"{settings.FRONTEND_URL}/verify-email?token={token}"
