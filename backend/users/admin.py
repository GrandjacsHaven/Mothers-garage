from django.contrib import admin
from .models import (
    User,
    Interest,
    MotherProfile,
    ServiceType,
    Speciality,  # ✅ Add this
    ProviderProfile,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "is_email_verified",
        "is_staff",
        "is_superuser",
    )
    search_fields = ("username", "email")
    list_filter = ("role", "is_staff", "is_superuser", "is_email_verified")
    list_editable = ("role",)


@admin.register(Interest)
class InterestAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(MotherProfile)
class MotherProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "age",
        "country",
        "preferred_language",
        "has_agreed_to_terms",
    )
    search_fields = ("user__username", "country", "preferred_language")
    filter_horizontal = ("interests",)
    exclude = ("pinned_location",)


@admin.register(ServiceType)
class ServiceTypeAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Speciality)  # ✅ New model
class SpecialityAdmin(admin.ModelAdmin):
    list_display = ("name", "service_type")
    search_fields = ("name", "service_type__name")
    list_filter = ("service_type",)


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "associated_clinic",
        "is_verified_by_admin",
        "subscription_plan",
        "country",
        "preferred_language",
    )
    search_fields = ("user__username", "associated_clinic")
    list_filter = (
        "is_verified_by_admin",
        "subscription_plan",
        "country",
        "preferred_language",
    )
    filter_horizontal = ("specialities",)
    exclude = ("pinned_location",)  # still optional

    # 🔥 REMOVED services_display, specialities_display, and certificates_display
