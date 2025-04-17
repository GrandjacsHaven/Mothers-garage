from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.gis.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField


class User(AbstractUser):
    ROLE_CHOICES = (
        ("mother", "Mother"),
        ("provider", "Service Provider"),
        ("admin", "Admin"),
        ("super_admin", "Super Admin"),
    )
    is_email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, null=True, blank=True)
    email = models.EmailField(unique=True, blank=False, null=False)

    def __str__(self):
        return f"{self.username} ({self.id})"


# === Other Models ===
class Interest(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


COUNTRY_CHOICES = (
    ("Uganda", "Uganda"),
    ("Canada", "Canada"),
)

LANGUAGE_CHOICES = (
    ("English", "English"),
    ("French", "French"),
)


class MotherProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mother_profile",
    )
    age = models.CharField(max_length=10, blank=True, null=True)
    weight = models.CharField(max_length=10, blank=True, null=True)
    height = models.CharField(max_length=10, blank=True, null=True)
    country = models.CharField(
        max_length=100, choices=COUNTRY_CHOICES, default="Uganda"
    )
    preferred_language = models.CharField(
        max_length=50,
        choices=LANGUAGE_CHOICES,
        default="English",
        blank=True,
        null=True,
    )
    pinned_location = models.PointField(geography=True, blank=True, null=True)
    postpartum_needs = models.TextField(blank=True, null=True)
    infant_care_preferences = models.TextField(blank=True, null=True)
    has_agreed_to_terms = models.BooleanField(default=False)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    interests = models.ManyToManyField("Interest", blank=True)
    has_completed_tutorial = models.BooleanField(default=False)

    def __str__(self):
        return f"MotherProfile: {self.user.username}"


class ServiceType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Speciality(models.Model):
    name = models.CharField(max_length=100)
    service_type = models.ForeignKey(
        ServiceType, on_delete=models.CASCADE, related_name="specialities"
    )

    class Meta:
        unique_together = ("name", "service_type")

    def __str__(self):
        return f"{self.name} ({self.service_type.name})"


SUBSCRIPTION_PLAN_CHOICES = (
    ("basic", "Basic"),
    ("standard", "Standard"),
    ("premium", "Premium"),
)


class ProviderProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="provider_profile",
    )
    pinned_location = models.PointField(geography=True, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    license_number = models.CharField(max_length=100, blank=True, null=True)
    credentials = models.TextField(blank=True, null=True)
    associated_clinic = models.CharField(max_length=100, blank=True, null=True)
    is_verified_by_admin = models.BooleanField(default=False)

    # 🟣 Subscription Fields
    subscription_plan = models.CharField(
        max_length=10, choices=SUBSCRIPTION_PLAN_CHOICES, blank=True, null=True
    )
    subscription_start = models.DateTimeField(blank=True, null=True)
    subscription_end = models.DateTimeField(blank=True, null=True)  # ✅ ADD THIS

    # 🧩 Services and classification
    service_types = models.ManyToManyField(ServiceType, blank=True)
    specialities = models.ManyToManyField("Speciality", blank=True)
    certificates = ArrayField(
        models.CharField(max_length=255), default=list, blank=True, null=True
    )
    is_searchable = models.BooleanField(default=True)

    # 🌍 Localization fields
    country = models.CharField(
        max_length=100, choices=COUNTRY_CHOICES, default="Uganda"
    )
    preferred_language = models.CharField(
        max_length=50,
        choices=LANGUAGE_CHOICES,
        default="English",
        blank=True,
        null=True,
    )

    # 🚩 Tutorial flag
    has_completed_tutorial = models.BooleanField(default=False)

    def __str__(self):
        return f"ProviderProfile: {self.user.username}"
