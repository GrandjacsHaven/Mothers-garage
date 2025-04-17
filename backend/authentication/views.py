# authentication/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.urls import reverse
from rest_framework.views import APIView
from django.contrib.auth.tokens import default_token_generator
import os
from django.conf import settings


User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Allows user to login with either username or email + password
    and receive an access & refresh token.
    """

    def post(self, request, *args, **kwargs):
        # If you want to support "email" or "username" interchangeably:
        login_key = request.data.get("login_key")
        password = request.data.get("password")

        if not login_key or not password:
            return Response({"detail": "Missing login_key or password."}, status=400)

        # Try authenticate by username or email
        user = None
        user = authenticate(request, username=login_key, password=password)
        if not user:
            # If not found, try email
            try:
                found_user = User.objects.get(email=login_key)
                user = authenticate(
                    request, username=found_user.username, password=password
                )
            except User.DoesNotExist:
                pass

        if user is None:
            return Response({"detail": "Invalid credentials."}, status=401)

        # If valid, generate tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        return Response(
            {
                "access": str(access),
                "refresh": str(refresh),
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "user_type": user.role,
            },
            status=200,
        )


class LogoutView(generics.GenericAPIView):
    """
    Allows user to blacklist their refresh token upon logout, if using blacklisting.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=400)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()  # mark the refresh token as blacklisted
        except TokenError:
            return Response({"detail": "Invalid or expired token."}, status=400)

        return Response({"detail": "Logged out successfully."}, status=205)


# Authenticating ADMINS AND SUPER_ADMINS
class AdminLoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/admin_login
    Only logs in users with role in [admin, super_admin].
    Returns an access & refresh token on success.
    """

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code != 200:
            return response  # invalid credentials

        data = response.data  # { access, refresh, ... }

        username = request.data.get("username")
        if not username:
            return Response({"detail": "Username is required."}, status=400)

        try:
            user = get_user_model().objects.get(username=username)
        except get_user_model().DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        # If user is not admin or super_admin => block
        if user.role not in ["admin", "super_admin"]:
            return Response({"detail": "You are not an admin."}, status=403)

        return response


class ForgotPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response(
                {"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "If that email exists, we have sent instructions."},
                status=status.HTTP_200_OK,
            )

        # Generate token and uid for the user
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Use RESET_PASSWORD_FRONTEND_URL from environment variable
        frontend_url = os.getenv("RESET_PASSWORD_FRONTEND_URL")
        if not frontend_url:
            # Fallback: use the current request host
            frontend_url = (
                f"{request.scheme}://{request.get_host()}/auth/reset-password"
            )

        reset_link = f"{frontend_url}?uid={uid}&token={token}"

        send_mail(
            subject="Password Reset Request",
            message=f"Click the link below to reset your password:\n{reset_link}",
            from_email="noreply@mothersgarage.com",
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {"detail": "Password reset link sent if email exists."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(generics.GenericAPIView):
    """
    POST /api/v1/auth/reset_password
    Expects the following data in the request body:
        - uid: the base64 encoded user ID string.
        - token: the password reset token.
        - password: the new password.
        - password2: the confirmation of the new password.
    If the passwords match and the token is valid, it will reset the user's password.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("password")
        confirm_password = request.data.get("password2")

        if not all([uid, token, new_password, confirm_password]):
            return Response(
                {"detail": "Missing data."}, status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"detail": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (ValueError, User.DoesNotExist):
            return Response(
                {"detail": "Invalid link."}, status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"detail": "Password reset successful. Please log in."},
            status=status.HTTP_200_OK,
        )
