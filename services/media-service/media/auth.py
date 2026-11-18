import jwt
from django.conf import settings


class AuthError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message


def require_admin(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise AuthError(401, "Missing token")
    try:
        claims = jwt.decode(header[7:], settings.JWT_SECRET, algorithms=["HS256"], issuer="auth-service")
    except jwt.PyJWTError:
        raise AuthError(401, "Invalid token")
    if claims.get("role") != "ADMIN":
        raise AuthError(403, "Admin only")
    return claims
