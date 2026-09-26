"""Response headers for the dashboard and API. The dashboard is a same-origin React build, so the
policy can be strict: only our own scripts, styles and connections, and no framing (clickjacking)."""

from app.core.site import is_page, normalize

CSP = "; ".join(
    [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",  # React sets a few inline style attributes
        "img-src 'self' data:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ]
)

# These pages load third-party assets or post to GitHub, so the strict policy would break them.
CSP_EXEMPT_PREFIXES = ("/setup", "/api/docs", "/api/openapi.json")


def security_headers(path: str, *, production: bool) -> dict[str, str]:
    headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    }
    if not path.startswith(CSP_EXEMPT_PREFIXES):
        headers["Content-Security-Policy"] = CSP
    if production:
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return headers


def cache_headers(path: str) -> dict[str, str]:
    """Hashed build assets never change, so they are cached for a year; the entry page must always be
    revalidated so a deploy is picked up; API answers are per-user and never stored."""
    if path.startswith("/assets/"):
        return {"Cache-Control": "public, max-age=31536000, immutable"}
    if path.startswith(("/api/", "/auth/")):
        return {"Cache-Control": "no-store"}
    if path in ("/favicon.svg", "/apple-touch-icon.png", "/og.png"):
        return {"Cache-Control": "public, max-age=86400"}
    if path in ("/theme-init.js", "/robots.txt", "/sitemap.xml") or is_page(normalize(path)):
        return {"Cache-Control": "no-cache"}
    return {}
