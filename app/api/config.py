from typing import Any

from fastapi import APIRouter, Request

from app.api.auth import settings_of

router = APIRouter(prefix="/api")


@router.get("/config")
async def public_config(request: Request) -> dict[str, Any]:
    """Non-secret settings the dashboard needs before anyone is signed in."""
    s = settings_of(request)
    return {
        "app_install_url": f"https://github.com/apps/{s.github_app_slug}/installations/new" if s.github_app_slug else None,
        "github_login": bool(s.github_oauth_client_id and s.github_oauth_client_secret),
        # what the public pricing section shows: the real limit, and whether upgrading is possible
        "free_reviews_per_month": s.free_reviews_per_month,
        "billing": bool(s.stripe_secret_key and s.stripe_price_id),
    }  # fmt: skip
