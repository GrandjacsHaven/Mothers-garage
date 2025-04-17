from django.contrib import admin
from django.db import transaction
from django.core.mail import send_mail
from django.contrib.gis.geos import Point
from django.contrib.auth import get_user_model

from onboarding.models import PendingProviderRegistration
from users.models import ProviderProfile, ServiceType, Speciality  # ✅ Updated

User = get_user_model()


@admin.register(PendingProviderRegistration)
class PendingProviderRegistrationAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "phone_number", "created_at")
    actions = ["approve_provider"]

    @transaction.atomic
    def approve_provider(self, request, queryset):
        for pending in queryset:
            user = User.objects.create(
                username=pending.username,
                email=pending.email,
                phone_number=pending.phone_number,
                password=pending.password,
                role="provider",
                is_email_verified=True,
            )

            profile = ProviderProfile.objects.create(
                user=user,
                bio=pending.bio,
                license_number=pending.license_number,
                associated_clinic=pending.associated_clinic,
                is_verified_by_admin=True,
                country=pending.country,
                preferred_language=pending.preferred_language,
            )

            if (
                pending.pinned_location_lat is not None
                and pending.pinned_location_lng is not None
            ):
                profile.pinned_location = Point(
                    float(pending.pinned_location_lng),
                    float(pending.pinned_location_lat),
                    srid=4326,
                )
                profile.save()

            # ✅ Set specialities
            if pending.speciality_ids:
                specialities = Speciality.objects.filter(id__in=pending.speciality_ids)
                profile.specialities.set(specialities)

            # ✅ Set services (THIS is the missing piece)
            if pending.service_type_ids:
                services = ServiceType.objects.filter(id__in=pending.service_type_ids)
                profile.service_types.set(services)

            profile.save()

            send_mail(
                subject="Your Provider Account is Approved",
                message=(
                    "Congratulations! Your service provider account has been approved by our admin. "
                    "Please log in using the email you registered with and the password you created."
                ),
                from_email="noreply@mothersgarage.com",
                recipient_list=[pending.email],
                fail_silently=True,
            )

            pending.delete()

    approve_provider.short_description = (
        "Approve selected pending provider registrations"
    )
