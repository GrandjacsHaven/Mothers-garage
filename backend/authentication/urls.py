# authentication/urls.py
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)
from .views import (
    CustomTokenObtainPairView,
    LogoutView,
    AdminLoginView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    # You can use DRF SimpleJWT's built-in or a custom view:
    path("login", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("admin_login", AdminLoginView.as_view(), name="admin_login"),
    path("refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout", LogoutView.as_view(), name="token_logout"),
    path("forgot_password", ForgotPasswordView.as_view(), name="forgot_password"),
    path("reset-password", ResetPasswordView.as_view(), name="reset-password"),
]
