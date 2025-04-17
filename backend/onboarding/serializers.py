# onboarding/serializers.py

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.conf import settings
from django.db import IntegrityError
from django.contrib.auth.hashers import make_password

from onboarding.models import PendingMotherRegistration, PendingProviderRegistration
from users.models import (
    MotherProfile,
    ProviderProfile,
    Interest,
    ServiceType,
)
from .models import EmailOTP

User = get_user_model()


class MainLandingSerializer(serializers.Serializer):
    message = serializers.CharField()


class UserTypeSelectionSerializer(serializers.Serializer):
    user_type = serializers.ChoiceField(
        choices=[("mother", "Mother"), ("provider", "Provider")]
    )


class ProviderSignUpSerializer(serializers.Serializer):
    """
    Deprecated direct sign-up for providers (still kept in code).
    If we needed to remove 'profession' here, we would do so.
    However, the new recommended flow is 'PendingProviderSignUpSerializer.'
    """

    username = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    pinned_location = serializers.DictField(required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    credentials = serializers.CharField(required=False, allow_blank=True)
    associated_clinic = serializers.CharField(required=False, allow_blank=True)
    service_type_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )
    certificates = serializers.ListField(
        child=serializers.FileField(), required=False, allow_empty=True
    )

    # profession = serializers.CharField(...)  # <-- WAS REMOVED from the older version

    def create(self, validated_data):
        # Implementation of direct sign-up, not used in final flow,
        # but kept for reference if needed.
        pass


class EmailOTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class EmailOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField()


class MotherConsentSerializer(serializers.ModelSerializer):
    has_agreed_to_terms = serializers.BooleanField(
        source="mother_profile.has_agreed_to_terms"
    )

    class Meta:
        model = User
        fields = ["has_agreed_to_terms"]

    def update(self, instance, validated_data):
        profile_data = validated_data.get("mother_profile")
        if not profile_data:
            raise ValidationError("No consent data provided.")
        mother_profile = instance.mother_profile
        mother_profile.has_agreed_to_terms = profile_data.get(
            "has_agreed_to_terms", mother_profile.has_agreed_to_terms
        )
        mother_profile.save()
        return instance


class SubscriptionPlanSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=["basic", "standard", "premium"])


class ProviderAdminVerificationSerializer(serializers.Serializer):
    provider_id = serializers.IntegerField()


class PaymentMethodUpdateSerializer(serializers.Serializer):
    payment_method = serializers.CharField()


# ---------------------
# NEW PENDING SIGNUP FLOW
# ---------------------


class PendingMotherSignUpSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    age = serializers.IntegerField(required=False)
    weight = serializers.DecimalField(required=False, max_digits=5, decimal_places=2)
    height = serializers.DecimalField(required=False, max_digits=5, decimal_places=2)
    country = serializers.CharField(required=False, allow_blank=True)
    preferred_language = serializers.CharField(
        required=False, allow_blank=True, default="English"
    )
    postpartum_needs = serializers.CharField(required=False, allow_blank=True)
    infant_care_preferences = serializers.CharField(required=False, allow_blank=True)
    interest_ids = serializers.ListField(
        child=serializers.IntegerField(), required=True, allow_empty=False
    )
    pinned_location = serializers.DictField(required=False)
    tos_agreed = serializers.BooleanField()

    def create(self, validated_data):
        from django.utils import timezone
        import random

        pinned = validated_data.pop("pinned_location", None)
        email = validated_data.get("email")
        raw_password = validated_data.pop("password")
        hashed_pw = make_password(raw_password)
        validated_data["password"] = hashed_pw
        new_code = str(random.randint(100000, 999999))

        # Try to get an existing pending registration
        try:
            pending = PendingMotherRegistration.objects.get(email=email)
            for field, value in validated_data.items():
                setattr(pending, field, value)
            if pinned:
                lat = pinned.get("lat")
                lng = pinned.get("lng")
                if lat is not None and lng is not None:
                    pending.pinned_location_lat = float(lat)
                    pending.pinned_location_lng = float(lng)
            pending.otp = new_code
            pending.otp_created_at = timezone.now()
            pending.save()
            return pending
        except PendingMotherRegistration.DoesNotExist:
            # create new
            pending = PendingMotherRegistration.objects.create(
                **validated_data, otp=new_code
            )
            if pinned:
                lat = pinned.get("lat")
                lng = pinned.get("lng")
                if lat is not None and lng is not None:
                    pending.pinned_location_lat = float(lat)
                    pending.pinned_location_lng = float(lng)
                    pending.save()
            return pending


class PendingProviderSignUpSerializer(serializers.Serializer):
    """
    Serializer for step-based provider sign-up.
    Maps `license_number` into the `credentials` field internally.
    """

    username = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)  # confirm pass

    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(
        required=False, allow_blank=True
    )  # <-- comes from frontend
    associated_clinic = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    preferred_language = serializers.CharField(
        required=False, allow_blank=True, default="English"
    )

    pinned_location = serializers.DictField(
        required=False
    )  # { "lat": ..., "lng": ... }

    certificates = serializers.ListField(
        child=serializers.FileField(), required=False, allow_empty=True
    )

    service_type_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )

    speciality_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password2"):
            raise ValidationError({"detail": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        from django.core.files.storage import default_storage

        pinned = validated_data.pop("pinned_location", None)
        uploaded_certs = validated_data.pop("certificates", [])
        raw_password = validated_data.pop("password")
        validated_data.pop("password2", None)

        # Previously: validated_data["credentials"] = license_number
        # Now: it's already part of validated_data

        hashed_pw = make_password(raw_password)
        validated_data["password"] = hashed_pw

        email = validated_data["email"]
        if PendingProviderRegistration.objects.filter(email=email).exists():
            raise ValidationError(
                {
                    "detail": "A pending provider registration with that email already exists."
                }
            )

        pending = PendingProviderRegistration.objects.create(**validated_data)

        if pinned:
            lat = pinned.get("lat")
            lng = pinned.get("lng")
            if lat is not None and lng is not None:
                pending.pinned_location_lat = float(lat)
                pending.pinned_location_lng = float(lng)
                pending.save()

        saved_paths = []
        for file_obj in uploaded_certs:
            filename = default_storage.save(f"certificates/{file_obj.name}", file_obj)
            saved_paths.append(filename)

        pending.certificates = saved_paths
        pending.service_type_ids = validated_data.get("service_type_ids", [])
        pending.speciality_ids = validated_data.get("speciality_ids", [])
        pending.save()

        return pending


class PendingProviderReviewSerializer(serializers.ModelSerializer):
    certificate_urls = serializers.SerializerMethodField()

    class Meta:
        model = PendingProviderRegistration
        fields = [
            "id",
            "username",
            "email",
            "phone_number",
            "bio",
            "license_number",
            "associated_clinic",
            "service_type_ids",
            "provider_type_ids",
            "certificates",
            "certificate_urls",
            "created_at",
            # Removed 'profession' from fields, see note below
            # "profession" was removed from the entire model
        ]

    def get_certificate_urls(self, obj):
        request = self.context.get("request")
        base_url = request.build_absolute_uri("/") if request else ""
        return [
            base_url.rstrip("/") + settings.MEDIA_URL + path
            for path in obj.certificates
        ]


class AdminUserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField()
    confirm_password = serializers.CharField()

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise ValidationError({"detail": "Passwords do not match."})
        return attrs
