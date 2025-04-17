# onboarding/translation.py
import requests
import os

LIBRETRANSLATE_ENDPOINT = os.environ.get(
    "LIBRETRANSLATE_ENDPOINT", "https://libretranslate/api/translate"
)
LIBRETRANSLATE_API_KEY = os.environ.get("LIBRETRANSLATE_API_KEY", "")


def translate_text(text, source_lang="en", target_lang="fr"):
    if not text:
        return text
    payload = {
        "q": text,
        "source": source_lang,
        "target": target_lang,
        "format": "text",
    }
    headers = {}
    if LIBRETRANSLATE_API_KEY:
        headers["Authorization"] = f"Bearer {LIBRETRANSLATE_API_KEY}"

    resp = requests.post(LIBRETRANSLATE_ENDPOINT, json=payload, headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        return data.get("translatedText", text)
    return text
