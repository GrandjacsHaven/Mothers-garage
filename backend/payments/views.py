# payments/views.py

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Subscription, BookingUsage
from rest_framework.views import APIView
from users.models import ProviderProfile
from .paypal_utils import get_paypal_access_token, get_order_details
from django.conf import settings

User = get_user_model()


class PayPalPaymentSuccessView(generics.GenericAPIView):
    """
    POST /api/paypal-payment-success
    Body: { "plan": "standard" or "premium" }
    Simulate subscription upgrade upon successful PayPal payment.
    """

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        plan = request.data.get("plan")
        if plan not in ["standard", "premium"]:
            return Response(
                {"detail": "Invalid plan for payment success."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if user.role != "provider":
            return Response(
                {"detail": "Only providers can purchase subscriptions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        sub, _ = Subscription.objects.get_or_create(user=user)
        sub.plan = plan
        sub.start_date = timezone.now()
        sub.end_date = timezone.now() + timedelta(days=30)
        sub.is_active = True
        sub.save()

        # Reflect in provider profile
        profile = getattr(user, "provider_profile", None)
        if profile:
            profile.subscription_plan = plan
            profile.subscription_end = sub.end_date  # ✅ sync to profile
            profile.is_searchable = True
            profile.save()

        return Response(
            {"detail": f"Subscription upgraded to {plan} for user {user.username}."},
            status=status.HTTP_200_OK,
        )


class BookingUsageIncrementView(generics.GenericAPIView):
    """
    POST /api/booking-increment
    This is a placeholder to simulate a new booking for the provider.
    In real usage, you might call this when a mother actually books a provider.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Typically we'd pass 'provider_id' or something
        user = request.user
        if user.role != "provider":
            return Response({"detail": "Not a provider account."}, status=403)

        usage, created = BookingUsage.objects.get_or_create(user=user)
        # Possibly check if cycle expired => usage.reset_cycle()

        usage.increment_usage()

        if usage.monthly_limit_reached():
            # Hide from search
            if hasattr(user, "provider_profile"):
                user.provider_profile.is_searchable = False
                user.provider_profile.save()

        return Response(
            {
                "detail": f"Booking usage incremented. used_this_month={usage.used_this_month}"
            },
            status=200,
        )


class CheckFirstTimeLoginView(generics.RetrieveAPIView):
    """
    GET /api/check_first_time
    Returns whether this provider has completed tutorial or not.
    If not completed, front end should show the tutorial.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if user.role != "provider":
            return Response({"detail": "Not a provider."}, status=403)

        provider_profile = getattr(user, "provider_profile", None)
        if not provider_profile:
            return Response({"detail": "No provider profile found."}, status=404)

        return Response(
            {"first_time_login": not provider_profile.has_completed_tutorial},
            status=200,
        )


class CompleteTutorialView(generics.GenericAPIView):
    """
    POST /api/complete_tutorial
    Mark has_completed_tutorial = True for the provider
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.role != "provider":
            return Response({"detail": "Not a provider account."}, status=403)

        provider_profile = getattr(user, "provider_profile", None)
        if not provider_profile:
            return Response({"detail": "No provider profile found."}, status=404)

        provider_profile.has_completed_tutorial = True
        provider_profile.save()
        return Response({"detail": "Tutorial completed."}, status=200)


class SubscriptionStatusView(APIView):
    """
    GET /api/v1/subscription_status
    Returns the current subscription plan and country for a provider.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # Confirm user is a provider
        if user.role != "provider":
            return Response(
                {"detail": "Only providers have subscription status."}, status=403
            )

        provider_profile = getattr(user, "provider_profile", None)
        if not provider_profile:
            return Response({"detail": "No provider profile found."}, status=404)

        subscription = getattr(user, "subscription", None)

        # Prefer active subscription from `Subscription` model
        if subscription and subscription.is_active and not subscription.has_expired():
            current_plan = subscription.plan
        else:
            current_plan = provider_profile.subscription_plan  # Don't assume basic

        return Response(
            {"subscription_plan": current_plan, "country": provider_profile.country},
            status=200,
        )


class FreePlanActivationView(generics.GenericAPIView):
    """
    POST /api/activate-free-plan
    Switches provider to free/basic plan.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.role != "provider":
            return Response(
                {"detail": "Only providers can activate free plan."}, status=403
            )

        sub, _ = Subscription.objects.get_or_create(user=user)
        sub.plan = "basic"
        sub.start_date = timezone.now()
        sub.end_date = timezone.now() + timedelta(
            days=30
        )  # ✅ 30-day cycle for free too
        sub.is_active = True
        sub.save()

        # 🟣 Update the ProviderProfile to sync end_date and plan (⏬ this is critical!)
        profile = getattr(user, "provider_profile", None)
        if profile:
            profile.subscription_plan = "basic"
            profile.subscription_end = sub.end_date  # ✅ SYNCED!
            profile.is_searchable = True
            profile.save()

        return Response({"detail": "Free plan activated."}, status=200)


PLAN_PRICING = {
    "standard": {"amount": "50.00", "currency": "USD"},
    "premium": {"amount": "100.00", "currency": "USD"},
    # Add more if needed
}


class PayPalVerifiedPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.role != "provider":
            return Response({"detail": "Not a provider account."}, status=403)

        order_id = request.data.get("order_id")
        plan = request.data.get("plan")

        if not order_id or not plan:
            return Response({"detail": "order_id and plan are required."}, status=400)
        if plan not in PLAN_PRICING:
            return Response({"detail": "Invalid plan type."}, status=400)

        try:
            access_token = get_paypal_access_token()
            order = get_order_details(order_id, access_token)
        except Exception as e:
            return Response(
                {"detail": f"Failed to verify payment: {str(e)}"}, status=400
            )

        # Validate order
        if order["status"] != "COMPLETED":
            return Response({"detail": "Order not completed."}, status=400)

        unit = order["purchase_units"][0]
        amount_paid = unit["amount"]["value"]
        currency_paid = unit["amount"]["currency_code"]
        payee_email = unit["payee"]["email_address"]

        expected = PLAN_PRICING[plan]
        if amount_paid != expected["amount"] or currency_paid != expected["currency"]:
            return Response(
                {"detail": "Payment amount or currency mismatch."}, status=400
            )

        if (
            settings.PAYPAL_MERCHANT_EMAIL
            and payee_email != settings.PAYPAL_MERCHANT_EMAIL
        ):
            return Response(
                {"detail": "Payment did not go to the correct merchant."}, status=400
            )

        # Activate subscription
        sub, _ = Subscription.objects.get_or_create(user=user)
        sub.plan = plan
        sub.start_date = timezone.now()
        sub.end_date = sub.start_date + timedelta(days=30)
        sub.is_active = True
        sub.save()

        # Reflect in profile
        profile = getattr(user, "provider_profile", None)
        if profile:
            profile.subscription_plan = plan
            profile.subscription_end = sub.end_date
            profile.is_searchable = True
            profile.save()

        return Response({"detail": f"Verified and activated {plan} plan."}, status=200)
