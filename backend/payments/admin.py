from django.contrib import admin
from payments.models import Subscription, BookingUsage


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "start_date", "end_date", "is_active", "expired")
    search_fields = ("user__username", "user__email")
    list_filter = ("plan", "is_active")

    def expired(self, obj):
        # Calls the model's has_expired() method to show expiration status
        return obj.has_expired()

    expired.boolean = True
    expired.short_description = "Expired?"


@admin.register(BookingUsage)
class BookingUsageAdmin(admin.ModelAdmin):
    list_display = ("user", "used_this_month", "cycle_start")
    search_fields = ("user__username", "user__email")
    list_filter = ("used_this_month",)
    actions = ["reset_booking_usage_cycle"]

    def reset_booking_usage_cycle(self, request, queryset):
        for booking in queryset:
            booking.reset_cycle()
        self.message_user(request, "Selected booking usage cycles have been reset.")

    reset_booking_usage_cycle.short_description = "Reset selected booking usage cycles"
