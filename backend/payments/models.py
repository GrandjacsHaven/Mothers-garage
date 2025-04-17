# payments/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

SUBSCRIPTION_PLAN_CHOICES = (
    ("basic", "Basic"),
    ("standard", "Standard"),
    ("premium", "Premium"),
)


class Subscription(models.Model):
    """
    Tracks a provider's subscription status, plan, start/end times, whether active, etc.
    A user might have multiple subscription records over time, but only one can be active.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.CharField(
        max_length=10, choices=SUBSCRIPTION_PLAN_CHOICES, blank=True, null=True
    )
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(blank=True, null=True)  # e.g. 30 days from start
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} subscription: {self.plan}"

    def has_expired(self):
        """
        Returns True if current subscription has reached its end_date.
        """
        if not self.end_date:
            return False
        return timezone.now() >= self.end_date

    def expire_and_revert(self):
        """
        If subscription is expired, revert user to 'basic' plan, set is_active=False,
        and update the user's ProviderProfile accordingly.
        """
        self.is_active = False
        self.save()

        provider_profile = getattr(self.user, "provider_profile", None)
        if provider_profile:
            provider_profile.subscription_plan = "basic"
            provider_profile.subscription_end = None  # Remove expired date
            provider_profile.is_searchable = True  # Allow visibility again
            provider_profile.save()

    def auto_renew_if_needed(self):
        """
        If the plan is 'basic' and it has expired, renew it for another 30 days.
        This keeps free-tier users cycling without interruption.
        """
        if self.plan == "basic" and self.has_expired():
            self.start_date = timezone.now()
            self.end_date = timezone.now() + timedelta(days=30)
            self.is_active = True
            self.save()

            provider_profile = getattr(self.user, "provider_profile", None)
            if provider_profile:
                provider_profile.subscription_end = self.end_date
                provider_profile.save()


class BookingUsage(models.Model):
    """
    Tracks monthly booking usage for each provider. Reset every 30 days or
    automatically using a scheduled job.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="booking_usage"
    )
    used_this_month = models.PositiveIntegerField(default=0)
    cycle_start = models.DateTimeField(auto_now_add=True)
    # optional cycle_end if you want to store an explicit date/time

    def __str__(self):
        return f"{self.user.username} usage: {self.used_this_month} bookings"

    def reset_cycle(self):
        """
        Resets used_this_month to 0 and sets cycle_start = now.
        Called monthly or as needed.
        """
        self.used_this_month = 0
        self.cycle_start = timezone.now()
        self.save()

    def monthly_limit_reached(self):
        """
        Returns True if the user has reached the monthly booking limit
        (5 for basic, 50 for standard, unlimited for premium).
        """
        plan = "basic"
        subscription = getattr(self.user, "subscription", None)
        if subscription and subscription.is_active and not subscription.has_expired():
            plan = subscription.plan
        elif hasattr(self.user, "provider_profile"):
            # fallback to provider_profile subscription_plan
            plan = self.user.provider_profile.subscription_plan or "basic"

        if plan == "basic":
            return self.used_this_month >= 5
        elif plan == "standard":
            return self.used_this_month >= 50
        elif plan == "premium":
            return False  # unlimited
        return True

    def increment_usage(self):
        """
        Increments booking usage by 1, check if limit reached, if so hide user from search.
        """
        self.used_this_month += 1
        self.save()

        if self.monthly_limit_reached():
            # Hide from mother searches
            provider_profile = getattr(self.user, "provider_profile", None)
            if provider_profile:
                # a custom flag to hide them from searches, or we can handle it in the search logic
                provider_profile.is_verified_by_admin = (
                    True  # not exactly the same as hiding
                )
                # Instead, we can store a new boolean: 'is_searchable'
                # but let's do that:
                provider_profile.is_searchable = False
                provider_profile.save()
