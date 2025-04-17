import requests
from django.conf import settings


def get_paypal_access_token():
    response = requests.post(
        f"{settings.PAYPAL_API_BASE}/v1/oauth2/token",
        auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_SECRET),
        data={"grant_type": "client_credentials"},
    )
    response.raise_for_status()
    return response.json()["access_token"]


def get_order_details(order_id, access_token):
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(
        f"{settings.PAYPAL_API_BASE}/v2/checkout/orders/{order_id}",
        headers=headers,
    )
    response.raise_for_status()
    return response.json()
