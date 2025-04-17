# payments/urls.py
from django.urls import path
from .views import (
    PayPalPaymentSuccessView,
    BookingUsageIncrementView,
    CheckFirstTimeLoginView,
    CompleteTutorialView,
    SubscriptionStatusView,
    FreePlanActivationView,
    PayPalVerifiedPaymentView,
)

urlpatterns = [
    path(
        "paypal-payment-success",
        PayPalPaymentSuccessView.as_view(),
        name="paypal_payment_success",
    ),
    path(
        "booking-increment",
        BookingUsageIncrementView.as_view(),
        name="booking_increment",
    ),
    path(
        "check_first_time", CheckFirstTimeLoginView.as_view(), name="check_first_time"
    ),
    path("complete_tutorial", CompleteTutorialView.as_view(), name="complete_tutorial"),
    path(
        "subscription_status",
        SubscriptionStatusView.as_view(),
        name="subscription_status",
    ),
    path(
        "activate-free-plan",
        FreePlanActivationView.as_view(),
        name="activate_free_plan",
    ),
    path(
        "paypal-verify",
        PayPalVerifiedPaymentView.as_view(),
        name="paypal_verified_payment",
    ),
]
