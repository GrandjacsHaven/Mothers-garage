# onboarding/models.py
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.db.models import JSONField
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class EmailOTP(models.Model):
    """
    One-time code for email verification.
    code could be 6 digits if you prefer, or a random UUID string.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_otps")
    code = models.CharField(max_length=10)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OTP for {self.user.email} -> {self.code}"


# On boarding new views


class PendingMotherRegistration(models.Model):
    username = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    password = models.CharField(max_length=255)  # hashed
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    age = models.CharField(max_length=10, blank=True, null=True)
    weight = models.CharField(max_length=10, blank=True, null=True)
    height = models.CharField(max_length=10, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    preferred_language = models.CharField(
        max_length=50, blank=True, null=True, default="English"
    )
    postpartum_needs = models.TextField(blank=True, null=True)
    infant_care_preferences = models.TextField(blank=True, null=True)
    interest_ids = ArrayField(models.IntegerField(), default=list, blank=True)
    pinned_location_lat = models.FloatField(blank=True, null=True)
    pinned_location_lng = models.FloatField(blank=True, null=True)
    tos_agreed = models.BooleanField(default=False)

    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PendingMotherRegistration: {self.email}"


class PendingProviderRegistration(models.Model):
    username = models.CharField(max_length=150, unique=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    password = models.CharField(max_length=255)  # hashed
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    license_number = models.CharField(max_length=100, blank=True, null=True)

    bio = models.TextField(blank=True, null=True)
    associated_clinic = models.CharField(max_length=150, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    preferred_language = models.CharField(
        max_length=50, blank=True, null=True, default="English"
    )

    # REMOVED the 'profession' field
    # profession = models.CharField(...)  # <-- REMOVED

    # service_type_ids, provider_type_ids remain
    service_type_ids = ArrayField(models.IntegerField(), default=list, blank=True)
    speciality_ids = ArrayField(
        models.IntegerField(), default=list, blank=True
    )  # ADD THIS

    # certificates are stored as file paths
    certificates = ArrayField(
        models.CharField(max_length=255), default=list, blank=True, null=True
    )

    # NEW: Storing the newly introduced 'services' and 'specialities'

    pinned_location_lat = models.FloatField(blank=True, null=True)
    pinned_location_lng = models.FloatField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PendingProviderRegistration: {self.email}"
