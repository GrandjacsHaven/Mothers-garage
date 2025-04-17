# onboarding/views.py
import random
from django.core.mail import send_mail
from users.models import Interest, ServiceType
from rest_framework.permissions import AllowAny
from rest_framework import status, generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from django.contrib.auth import get_user_model
from onboarding.serializers import (
    PendingMotherSignUpSerializer,
    PendingProviderSignUpSerializer,
    PendingProviderReviewSerializer,
)
from onboarding.models import PendingMotherRegistration, PendingProviderRegistration
from users.models import MotherProfile, Interest, ProviderProfile
from .models import EmailOTP
from django.db import transaction
from django.contrib.gis.geos import Point
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from payments.models import BookingUsage
from django.utils import timezone
from .serializers import (
    MainLandingSerializer,
    UserTypeSelectionSerializer,
    # MotherSignUpSerializer,
    ProviderSignUpSerializer,
    EmailOTPRequestSerializer,
    EmailOTPVerifySerializer,
    MotherConsentSerializer,
    SubscriptionPlanSerializer,
    ProviderAdminVerificationSerializer,
    PaymentMethodUpdateSerializer,
    AdminUserCreateSerializer,
)

User = get_user_model()


class MainLandingView(generics.GenericAPIView):
    """
    GET /api/v1/landing
    Returns a welcome message, the platform description, and possible next steps.
    """

    def get(self, request, *args, **kwargs):
        data = {
            "welcome_message": "Welcome to Mother's Garage - Your trusted platform for on-demand home care services.",
            "actions": {
                "get_started": "/api/v1/onboarding/select_user_type",
                "login": "/api/v1/auth/login",  # or wherever your login is
            },
        }
        return Response(data, status=200)


class UserTypeSelectionView(generics.GenericAPIView):
    """
    POST /api/v1/onboarding/select_user_type
    If you want an explicit step for the user to choose mother/provider.
    """

    serializer_class = UserTypeSelectionSerializer
    permission_classes = [AllowAny]  # <-- Add this line here

    def post(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user_type = ser.validated_data["user_type"]
        return Response({"detail": f"You selected {user_type}."}, status=200)


# class MotherSignUpView(generics.CreateAPIView):
#     serializer_class = MotherSignUpSerializer
#     permission_classes = [AllowAny]

#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)

#         if not serializer.is_valid():
#             print("Signup validation failed:", serializer.errors)  # 👈 SHOW ERRORS
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         self.perform_create(serializer)
#         return Response({"message": "Mother registered successfully."}, status=status.HTTP_201_CREATED)


class ProviderSignUpView(generics.CreateAPIView):
    """
    POST /api/v1/onboarding/provider_signup
    Creates a new 'provider' user.
    They require admin verification to become active.
    """

    permission_classes = [AllowAny]  # 👈 Add this!
    serializer_class = ProviderSignUpSerializer


# onboarding/views.py (update RequestEmailOTPView)
class RequestEmailOTPView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmailOTPRequestSerializer

    def post(self, request, *args, **kwargs):
        # This endpoint is now only used for resending the OTP.
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]

        try:
            pending = PendingMotherRegistration.objects.get(email=email)
        except PendingMotherRegistration.DoesNotExist:
            return Response(
                {"detail": "No pending registration found for that email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        now = timezone.now()
        # Prevent duplicate emails: require at least 60 seconds between sends.
        if pending.otp_created_at and (now - pending.otp_created_at).seconds < 60:
            return Response(
                {
                    "detail": "OTP was sent recently, please wait before requesting a new one."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate a new OTP (or you could choose to resend the same one)
        code = str(random.randint(100000, 999999))
        pending.otp = code
        pending.otp_created_at = now
        pending.save()

        send_mail(
            "Mother's Garage - Your OTP Code (Resent)",
            f"Your new One-Time Code is: {code}\nPlease enter this code in the app to verify your email.",
            "noreply@mothersgarage.com",
            [email],
            fail_silently=True,
        )
        return Response(
            {"detail": "OTP has been resent to your email."}, status=status.HTTP_200_OK
        )


# class VerifyEmailOTPView(generics.GenericAPIView):
#     serializer_class = EmailOTPVerifySerializer

#     def post(self, request, *args, **kwargs):
#         ser = self.get_serializer(data=request.data)
#         ser.is_valid(raise_exception=True)
#         email = ser.validated_data["email"]
#         code = ser.validated_data["code"]

#         try:
#             pending = PendingMotherRegistration.objects.get(email=email)
#         except PendingMotherRegistration.DoesNotExist:
#             return Response({"detail": "No pending registration found for that email."}, status=404)

#         if pending.otp != code:
#             return Response({"detail": "Invalid or expired code."}, status=400)

#         # OTP is correct – create the actual user account
#         try:
#             user = User.objects.create(
#                 username=pending.username,
#                 email=pending.email,
#                 phone_number=pending.phone_number,
#                 first_name=pending.first_name,
#                 last_name=pending.last_name,
#                 # Directly assign the hashed password from pending:
#                 password=pending.password,
#                 is_email_verified=True,
#             )
#         except Exception as e:
#             return Response({"detail": "Error creating user account."}, status=400)

#         # Create the mother profile from pending data
#         profile_data = {
#             "age": pending.age,
#             "weight": pending.weight,
#             "height": pending.height,
#             "country": pending.country,
#             "preferred_language": pending.preferred_language,
#             "postpartum_needs": pending.postpartum_needs,
#             "infant_care_preferences": pending.infant_care_preferences,
#             "has_agreed_to_terms": pending.tos_agreed,
#         }
#         mother_profile = MotherProfile.objects.create(user=user, **profile_data)

#         # If location was saved
#         if pending.pinned_location_lat and pending.pinned_location_lng:
#             mother_profile.pinned_location = Point(pending.pinned_location_lng, pending.pinned_location_lat)
#             mother_profile.save()

#         # Set the many-to-many interests
#         interests = Interest.objects.filter(id__in=pending.interest_ids)
#         mother_profile.interests.set(interests)
#         mother_profile.save()

#         # Delete pending record once registration is complete
#         pending.delete()

#         return Response({"detail": "Email verified successfully and account created."}, status=200)


class VerifyEmailOTPView(generics.GenericAPIView):
    serializer_class = EmailOTPVerifySerializer  # your existing serializer
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]

        # Look for the pending registration record using the provided email
        try:
            pending = PendingMotherRegistration.objects.get(email=email)
        except PendingMotherRegistration.DoesNotExist:
            return Response(
                {"detail": "No pending registration found for that email."}, status=404
            )

        # If the OTP does not match, return an error
        if pending.otp != code:
            return Response({"detail": "Invalid or expired code."}, status=400)

        # OTP is correct: create the actual User
        user = User.objects.create(
            username=pending.username,
            email=pending.email,
            phone_number=pending.phone_number,
            password=pending.password,  # Already hashed
            is_email_verified=True,
            role="mother",  # Specify role as needed
        )

        # Create the corresponding MotherProfile with pending data
        mother_profile = MotherProfile.objects.create(
            user=user,
            age=pending.age,
            weight=pending.weight,
            height=pending.height,
            country=pending.country,
            preferred_language=pending.preferred_language,
            postpartum_needs=pending.postpartum_needs,
            infant_care_preferences=pending.infant_care_preferences,
            has_agreed_to_terms=pending.tos_agreed,
        )

        # If location data was provided, assign it using a Point field
        if pending.pinned_location_lat and pending.pinned_location_lng:
            mother_profile.pinned_location = Point(
                float(pending.pinned_location_lng),
                float(pending.pinned_location_lat),
                srid=4326,  # Adjust the SRID if necessary
            )
            mother_profile.save()

        # Set interests if provided (ManyToMany field)
        if pending.interest_ids:
            interests = Interest.objects.filter(id__in=pending.interest_ids)
            mother_profile.interests.set(interests)

        # Registration complete; remove the pending record
        pending.delete()

        return Response({"detail": "Email verified, account created."}, status=200)


class MotherConsentView(generics.UpdateAPIView):
    """
    PATCH /api/v1/onboarding/mother_consent
    Mother sets has_agreed_to_terms = True
    """

    serializer_class = MotherConsentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user  # or explicit lookup


class ProviderAdminVerificationView(generics.GenericAPIView):
    """
    POST /api/v1/onboarding/admin_verify_provider
    For an admin to verify the provider.
    This sets is_verified_by_admin = True.
    """

    serializer_class = ProviderAdminVerificationSerializer
    # Real scenario: only Admin can call this
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        provider_id = ser.validated_data["provider_id"]
        try:
            provider = User.objects.get(id=provider_id, role="provider")
        except User.DoesNotExist:
            return Response({"detail": "Provider not found."}, status=404)

        provider.is_verified_by_admin = True
        provider.save()
        # Possibly send an email to provider
        send_mail(
            subject="Mother's Garage - Provider Approved",
            message="Your provider account is verified by admin. You may now log in.",
            from_email="noreply@mothersgarage.com",
            recipient_list=[provider.email],
            fail_silently=True,
        )
        return Response(
            {"detail": f"Provider {provider.username} verified."}, status=200
        )


class ProviderSubscriptionView(generics.GenericAPIView):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.role != "provider":
            return Response({"detail": "Not a provider account."}, status=403)
        provider_profile = getattr(request.user, "provider_profile", None)
        if not provider_profile:
            return Response({"detail": "No provider profile found."}, status=404)

        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        plan = ser.validated_data["plan"]
        provider_profile.subscription_plan = plan
        provider_profile.save()
        return Response({"detail": f"Subscription plan set to {plan}."}, status=200)


class MotherDashboardView(generics.GenericAPIView):
    """
    GET /api/v1/onboarding/mother_dashboard
    Returns a simple structure for the mother’s dashboard:
      - welcome message
      - module cards: teletherapy, home care, e-learning, social networking, AI for mothers
      - settings link
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != "mother":
            return Response({"detail": "Not a mother account."}, status=403)
        data = {
            "welcome_message": f"Welcome {request.user.first_name}!",
            "modules": [
                "Teletherapy",
                "Home Care",
                "E-Learning",
                "Social Networking",
                "AI for Mothers",
            ],
            "settings_link": "/api/v1/onboarding/mother_settings",
        }
        return Response(data, status=200)


# class ProviderDashboardView(generics.GenericAPIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def get(self, request, *args, **kwargs):
#         if request.user.role != "provider":
#             return Response({"detail": "Not a provider account."}, status=403)
#         provider_profile = getattr(request.user, "provider_profile", None)
#         if not provider_profile:
#             return Response({"detail": "No provider profile found."}, status=404)
#         data = {
#             "welcome_message": f"Welcome {request.user.first_name}, you are on {provider_profile.subscription_plan} plan.",
#             "tutorial_shown": provider_profile.has_completed_tutorial,  # Update based on profile value if needed
#             "settings_link": "/api/v1/onboarding/provider_settings",
#         }
#         return Response(data, status=200)


class ProviderWorkspaceOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        subscription = getattr(user, "subscription", None)
        if subscription:
            subscription.auto_renew_if_needed()
        print(f"[DEBUG] Authenticated user: {user} (ID: {user.id}, Role: {user.role})")

        if user.role != "provider":
            print("[DEBUG] User is not a provider")
            return Response({"detail": "Not a provider account."}, status=403)

        profile = getattr(user, "provider_profile", None)
        if not profile:
            print("[DEBUG] Provider profile NOT FOUND.")
            return Response({"detail": "No provider profile found."}, status=404)

        print("[DEBUG] Provider profile found.")
        print(f"[DEBUG] Provider subscription_plan: {profile.subscription_plan}")
        print(
            f"[DEBUG] Provider specialities: {[s.name for s in profile.specialities.all()]}"
        )
        print(f"[DEBUG] Provider subscription_end: {profile.subscription_end}")

        plan = profile.subscription_plan or "none"
        booking_limit = 5 if plan == "basic" else 50 if plan == "standard" else None

        usage_instance = BookingUsage.objects.filter(user=user).first()
        used = usage_instance.used_this_month if usage_instance else 0

        plan_days_remaining = 0
        if profile.subscription_end:
            plan_days_remaining = max(
                (profile.subscription_end - timezone.now()).days, 0
            )

        print(
            f"[DEBUG] Usage: used={used}, booking_limit={booking_limit}, days_remaining={plan_days_remaining}"
        )
        should_warn = False
        if plan in ["standard", "premium"] and plan_days_remaining <= 5:
            should_warn = True

        # Optional for free-plan testing (you can comment out later)
        # if plan == "basic" and plan_days_remaining <= 5:
        #     should_warn = True

        services = list(set(s.service_type.name for s in profile.specialities.all()))

        response_data = {
            "subscription": {
                "plan": plan,
                "booking_limit": booking_limit,
                "bookings_used": used,
                "days_remaining": plan_days_remaining,
                "is_limit_reached": booking_limit is not None and used >= booking_limit,
                "next_renewal_date": (
                    profile.subscription_end.isoformat()
                    if profile.subscription_end
                    else None
                ),
                "should_warn": should_warn,  # ✅ This is what you missed
            },
            "services": services,
            "settings_link": "/api/v1/onboarding/provider_settings",
        }

        print("[DEBUG] Final response:", response_data)
        print("[DEBUG] Returning services:", services)

        return Response(response_data)


class MotherSettingsView(generics.GenericAPIView):
    """
    GET/POST/PATCH /api/v1/onboarding/mother_settings
    - Update personal data (age, weight, height, postpartum needs, etc.)
    - Change email (requires new OTP)
    - Change password (old + new)
    - Update payment method
    - Update preferred language and country
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != "mother":
            return Response({"detail": "Not a mother account."}, status=403)

        user = request.user
        try:
            profile = user.mother_profile  # Access the related MotherProfile
        except MotherProfile.DoesNotExist:
            return Response({"detail": "Mother profile does not exist."}, status=404)

        # Return mother’s settings info including language and country
        data = {
            "email": user.email,
            "age": profile.age,
            "weight": profile.weight,
            "height": profile.height,
            "postpartum_needs": profile.postpartum_needs,
            "infant_care_preferences": profile.infant_care_preferences,
            "preferred_language": profile.preferred_language,  # new field
            "country": profile.country,  # new field
        }
        return Response(data, status=200)

    def patch(self, request, *args, **kwargs):
        if request.user.role != "mother":
            return Response({"detail": "Not a mother account."}, status=403)

        user = request.user
        try:
            profile = user.mother_profile  # Get the associated mother profile
        except MotherProfile.DoesNotExist:
            return Response({"detail": "Mother profile does not exist."}, status=404)

        # Update email if provided
        email = request.data.get("email")
        if email and email != user.email:
            user.email = email
            user.is_email_verified = False
            user.save()
            return Response(
                {"detail": "Email updated, please verify with new OTP."}, status=200
            )

        # Update password if provided
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_new_password = request.data.get("confirm_new_password")
        if old_password and new_password and confirm_new_password:
            if not user.check_password(old_password):
                return Response({"detail": "Old password is incorrect."}, status=400)
            if new_password != confirm_new_password:
                return Response({"detail": "New passwords do not match."}, status=400)
            user.set_password(new_password)
            user.save()
            return Response({"detail": "Password changed successfully."}, status=200)

        # (Optional) Payment method updates can be handled here, if needed
        if "payment_method" in request.data:
            user.payment_method = request.data["payment_method"]
            user.save()
            return Response({"detail": "Payment method updated."}, status=200)

        # Update fields in MotherProfile
        if "age" in request.data:
            profile.age = request.data["age"]
        if "weight" in request.data:
            profile.weight = request.data["weight"]
        if "height" in request.data:
            profile.height = request.data["height"]
        if "postpartum_needs" in request.data:
            profile.postpartum_needs = request.data["postpartum_needs"]
        if "infant_care_preferences" in request.data:
            profile.infant_care_preferences = request.data["infant_care_preferences"]

        # **New:** Update preferred_language and country
        if "preferred_language" in request.data:
            profile.preferred_language = request.data["preferred_language"]
        if "country" in request.data:
            profile.country = request.data["country"]

        profile.save()
        return Response({"detail": "Settings updated."}, status=200)


class ProviderSettingsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != "provider":
            return Response({"detail": "Not a provider account."}, status=403)
        provider_profile = getattr(request.user, "provider_profile", None)
        if not provider_profile:
            return Response({"detail": "No provider profile found."}, status=404)
        data = {
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "phone_number": request.user.phone_number,
            "license_number": provider_profile.license_number,
            "bio": provider_profile.bio,
            "associated_clinic": provider_profile.associated_clinic,
            "subscription_plan": provider_profile.subscription_plan,
            "preferred_language": provider_profile.preferred_language,
            "country": provider_profile.country,
        }
        return Response(data, status=200)

    def patch(self, request, *args, **kwargs):
        if request.user.role != "provider":
            return Response({"detail": "Not a provider account."}, status=403)

        provider_profile = getattr(request.user, "provider_profile", None)
        if not provider_profile:
            return Response({"detail": "No provider profile found."}, status=404)

        try:
            # Update User fields
            user = request.user
            if "email" in request.data:
                user.email = request.data["email"]
                user.is_email_verified = False

            if "first_name" in request.data:
                user.first_name = request.data["first_name"]

            if "last_name" in request.data:
                user.last_name = request.data["last_name"]

            if "phone_number" in request.data:
                user.phone_number = request.data["phone_number"]

            user.save()

            # Handle password change
            old_password = request.data.get("old_password")
            new_password = request.data.get("new_password")
            confirm_new_password = request.data.get("confirm_new_password")

            if old_password or new_password or confirm_new_password:
                if not (old_password and new_password and confirm_new_password):
                    raise ValidationError("All password fields are required.")

                if not user.check_password(old_password):
                    raise ValidationError("Old password is incorrect.")

                if new_password != confirm_new_password:
                    raise ValidationError("New passwords do not match.")

                user.set_password(new_password)
                user.save()

            # Update ProviderProfile fields
            if "subscription_plan" in request.data:
                provider_profile.subscription_plan = request.data["subscription_plan"]

            if "license_number" in request.data:
                provider_profile.license_number = request.data["license_number"]

            if "bio" in request.data:
                provider_profile.bio = request.data["bio"]

            if "associated_clinic" in request.data:
                provider_profile.associated_clinic = request.data["associated_clinic"]

            if "preferred_language" in request.data:
                provider_profile.preferred_language = request.data["preferred_language"]

            if "country" in request.data:
                provider_profile.country = request.data["country"]

            provider_profile.save()

            return Response({"detail": "Provider settings updated."}, status=200)

        except ValidationError as ve:
            return Response({"detail": str(ve)}, status=400)

        except Exception as e:
            return Response({"detail": f"An unexpected error occurred: {str(e)}"}, status=500)


class InterestListView(generics.ListAPIView):
    """
    GET /api/v1/onboarding/interests
    Returns all possible mother interests, e.g. Teletherapy, Home Care, ...
    """

    permission_classes = [AllowAny]
    queryset = Interest.objects.all()

    def list(self, request, *args, **kwargs):
        # Return as JSON
        interests = self.get_queryset()
        data = []
        for i in interests:
            data.append({"id": i.id, "name": i.name})
        return Response(data, status=200)


class ServiceTypeListView(generics.ListAPIView):
    """
    GET /api/v1/onboarding/service_types
    Return e.g. "Postnatal Care", "Physiotherapy" etc.
    """

    permission_classes = [AllowAny]
    queryset = ServiceType.objects.all()

    def list(self, request, *args, **kwargs):
        service_types = self.get_queryset()
        data = []
        for st in service_types:
            data.append({"id": st.id, "name": st.name})
        return Response(data, status=200)


# New pending view
class PendingMotherSignUpView(generics.CreateAPIView):
    """
    Instead of creating a live user immediately, store the registration data temporarily.
    This endpoint now also generates and sends the OTP to the mother's email.
    """

    serializer_class = PendingMotherSignUpSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pending = serializer.save()

        # OTP generation and email sending are handled here.
        # It is assumed that 'pending.otp' was generated during serializer.save()
        send_mail(
            "Mother's Garage - Your OTP Code",
            f"Your One-Time Code is: {pending.otp}\nPlease enter this code in the app to verify your email.",
            "noreply@mothersgarage.com",
            [pending.email],
            fail_silently=True,
        )
        return Response(
            {
                "detail": "Pending registration created. An OTP has been sent to your email."
            },
            status=status.HTTP_201_CREATED,
        )


class PendingProviderSignUpView(generics.CreateAPIView):
    """
    Saves the provider sign-up data in a PendingProviderRegistration record.
    Admin must later approve them to finalize the user account.
    """

    serializer_class = PendingProviderSignUpSerializer
    permission_classes = [AllowAny]  # or more restricted if you prefer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pending = serializer.save()

        # Possibly send an email to the provider to say
        # "We have received your application, an admin will verify soon."
        from django.core.mail import send_mail

        send_mail(
            subject="Thank you for applying as a Service Provider",
            message=(
                "Your provider registration is received. "
                "An admin will review your details and verify your account soon.\n\n"
                "We will let you know once your account is approved."
            ),
            from_email="noreply@mothersgarage.com",
            recipient_list=[pending.email],
            fail_silently=True,
        )

        return Response(
            {
                "detail": (
                    "Pending provider registration created. "
                    "Please wait for admin approval."
                )
            },
            status=status.HTTP_201_CREATED,
        )


# admin verification view to verify service providers
class AdminApproveProviderView(generics.GenericAPIView):
    """
    POST /onboarding/admin_approve_provider
    Finalizes a pending provider by creating a real user + ProviderProfile.
    """

    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        pending_id = request.data.get("pending_id")
        if not pending_id:
            return Response({"detail": "pending_id is required."}, status=400)

        try:
            pending = PendingProviderRegistration.objects.get(id=pending_id)
        except PendingProviderRegistration.DoesNotExist:
            return Response({"detail": "No such pending provider."}, status=404)

        # Create the actual user account
        user = User.objects.create(
            username=pending.username,
            email=pending.email,
            phone_number=pending.phone_number,
            password=pending.password,  # already hashed
            role="provider",
            is_email_verified=True,
        )

        # Create ProviderProfile
        provider_profile = ProviderProfile.objects.create(
            user=user,
            bio=pending.bio,
            license_number=pending.license_number,
            associated_clinic=pending.associated_clinic,
            is_verified_by_admin=True,
            country=pending.country,
            preferred_language=pending.preferred_language,
            subscription_plan=None,
        )

        # Assign pinned location if present
        if pending.pinned_location_lat and pending.pinned_location_lng:
            provider_profile.pinned_location = Point(
                float(pending.pinned_location_lng),
                float(pending.pinned_location_lat),
                srid=4326,
            )

        provider_profile.save()

        # Set ManyToMany service types and specialities
        if pending.service_type_ids:
            service_types = ServiceType.objects.filter(id__in=pending.service_type_ids)
            provider_profile.service_types.set(service_types)

        if hasattr(pending, "speciality_ids") and pending.speciality_ids:
            from users.models import Speciality

            specialities = Speciality.objects.filter(id__in=pending.speciality_ids)
            provider_profile.specialities.set(specialities)

        # Remove the pending record
        pending.delete()

        # Send email to notify the provider
        send_mail(
            subject="Provider Account Approved",
            message="Your account is now active. Please log in.",
            from_email="noreply@mothersgarage.com",
            recipient_list=[user.email],
            fail_silently=True,
        )

        return Response(
            {"detail": f"Provider '{user.username}' is now approved and can log in."},
            status=200,
        )


# AMNIN AND SUPER_ADMIN DASHBOARD VIEWS
class AdminDashboardView(generics.GenericAPIView):
    """
    GET /api/v1/onboarding/admin_dashboard
    Lists pending providers for an admin user.
    """

    permission_classes = [permissions.IsAuthenticated]  # or a custom permission

    def get(self, request, *args, **kwargs):
        # Option 1: If you rely on role="admin" to check admin privileges:
        if request.user.role not in ["admin", "super_admin"]:
            return Response({"detail": "Not an admin account."}, status=403)

        pending_providers = PendingProviderRegistration.objects.all().order_by(
            "-created_at"
        )
        data = []
        for p in pending_providers:
            data.append(
                {
                    "pending_id": p.id,
                    "username": p.username,
                    "email": p.email,
                    "profession": p.profession,
                    "created_at": p.created_at.isoformat(),
                }
            )

        return Response(
            {
                "message": f"Welcome Admin {request.user.username}",
                "pending_providers": data,
            },
            status=200,
        )


class SuperAdminDashboardView(generics.GenericAPIView):
    """
    GET /api/v1/onboarding/super_admin_dashboard
    Lists all pending providers, possibly also lists admin accounts, etc.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Here we check role or is_superuser
        if request.user.role != "super_admin":
            return Response({"detail": "Not a super_admin account."}, status=403)

        # Possibly show pending providers, admin user stats, etc.
        pending_providers = PendingProviderRegistration.objects.all().order_by(
            "-created_at"
        )
        data = []
        for p in pending_providers:
            data.append(
                {
                    "pending_id": p.id,
                    "username": p.username,
                    "email": p.email,
                    "profession": p.profession,
                    "created_at": p.created_at.isoformat(),
                }
            )

        # You could also list admin users
        from django.contrib.auth import get_user_model

        User = get_user_model()
        admins = (
            User.objects.filter(role="admin")
            .order_by("username")
            .values("id", "username", "email")
        )

        return Response(
            {
                "message": f"Welcome Super Admin {request.user.username}",
                "pending_providers": data,
                "admins": list(admins),
            },
            status=200,
        )


# creating an admin
class SuperAdminCreateAdminView(generics.GenericAPIView):
    """
    POST /api/v1/onboarding/create_admin_user
    Allows super_admin to create a user with role="admin".
    """

    serializer_class = AdminUserCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # check if user is super_admin
        if request.user.role != "super_admin":
            return Response(
                {"detail": "Only super_admin can create admin users."}, status=403
            )

        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)

        validated = ser.validated_data
        from django.contrib.auth.hashers import make_password

        hashed_pw = make_password(validated["password"])

        # create admin user
        User = get_user_model()
        try:
            user = User.objects.create(
                username=validated["username"],
                email=validated["email"],
                first_name=validated.get("first_name", ""),
                last_name=validated.get("last_name", ""),
                password=hashed_pw,
                role="admin",
                is_email_verified=True,  # you can decide
                is_staff=True,  # optional to allow Django admin access
            )
        except IntegrityError:
            return Response({"detail": "Username or email already exists."}, status=400)

        return Response({"detail": f"Admin user {user.username} created."}, status=201)


# We'll get to thumbnails later, but for now, let's assume you have a simple list of providers.
# This is a naive implementation, assuming you have a ProviderProfile model with a user FK.
class SearchProvidersView(generics.ListAPIView):
    """
    GET /api/onboarding/search_providers?service=Teletherapy
    Returns providers that match the requested service
    and (optionally) the mother's country.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        if user.role != "mother":
            return Response(
                {"detail": "Only mothers can search providers."}, status=403
            )

        service = request.query_params.get("service")
        if not service:
            return Response({"detail": "Missing 'service' query param."}, status=400)

        # Normalize service name
        normalized_service = service.strip().lower()

        mother_profile = getattr(user, "mother_profile", None)
        if not mother_profile:
            return Response({"detail": "No mother profile found."}, status=404)

        mother_country = mother_profile.country.strip().lower()

        # Fetch providers with matching service and country
        providers = ProviderProfile.objects.filter(
            is_searchable=True,
            service_types__name__iexact=normalized_service,
            country__iexact=mother_country,
        ).distinct()

        print(
            f"[DEBUG] Searching for service: '{normalized_service}' in country: '{mother_country}'"
        )
        print(f"[DEBUG] Matching providers found: {providers.count()}")

        data = [
            {
                "id": p.user.id,
                "username": p.user.username,
                "services": [s.name for s in p.service_types.all()],
                "specialities": [s.name for s in p.specialities.all()],
                "subscription_plan": p.subscription_plan,
                "country": p.country,
            }
            for p in providers
        ]

        return Response({"providers": data}, status=200)


class CheckMotherFirstTimeView(generics.RetrieveAPIView):
    """
    GET /api/v1/onboarding/check_mother_first_time
    Returns whether the mother has completed the tutorial.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Ensure the logged-in user is a mother
        if request.user.role != "mother":
            return Response({"detail": "Not a mother account."}, status=403)
        mother_profile = getattr(request.user, "mother_profile", None)
        if not mother_profile:
            return Response({"detail": "No mother profile found."}, status=404)
        return Response(
            {"first_time_login": not mother_profile.has_completed_tutorial}, status=200
        )


class CompleteMotherTutorialView(generics.GenericAPIView):
    """
    POST /api/v1/onboarding/complete_mother_tutorial
    Marks the tutorial as completed for the mother.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.role != "mother":
            return Response({"detail": "Not a mother account."}, status=403)
        mother_profile = getattr(request.user, "mother_profile", None)
        if not mother_profile:
            return Response({"detail": "No mother profile found."}, status=404)
        mother_profile.has_completed_tutorial = True
        mother_profile.save()
        return Response({"detail": "Tutorial completed."}, status=200)


class SpecialitiesByServiceView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        # Fetch all ServiceTypes with pre-fetched specialities
        service_types = ServiceType.objects.all().prefetch_related("specialities")
        data = []
        for st in service_types:
            data.append(
                {
                    "id": st.id,
                    "name": st.name,
                    "specialities": [
                        {"id": spec.id, "name": spec.name}
                        for spec in st.specialities.all()
                    ],
                }
            )
        return Response(data, status=200)
