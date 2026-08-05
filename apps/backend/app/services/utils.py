import hashlib
import re
import secrets


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"tenant-{secrets.token_hex(4)}"


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def generate_webhook_key() -> str:
    return secrets.token_urlsafe(24)


def generate_api_key() -> str:
    return f"ff_{secrets.token_urlsafe(32)}"
