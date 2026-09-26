"""Cross-site request check for the cookie-authenticated API.

The session cookie is SameSite=Lax, which already stops browsers sending it on cross-site POSTs.
This is a second layer: a state-changing request from a browser carries an Origin header, and it must
name this site. Requests with no Origin (curl, server-to-server) are not browser CSRF and pass; they
still need a valid session cookie. Webhooks are not covered: they authenticate by signature.
"""

from urllib.parse import urlsplit

UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}
PROTECTED_PREFIXES = ("/api/", "/auth/")


def origin_allowed(
    method: str, path: str, origin: str | None, host: str | None, public_url: str
) -> bool:
    if method not in UNSAFE or not path.startswith(PROTECTED_PREFIXES):
        return True
    if origin is None:
        return True
    netloc = urlsplit(origin).netloc.lower() if origin != "null" else ""
    if not netloc:
        return False
    allowed = {urlsplit(public_url).netloc.lower()}
    if host:
        allowed.add(host.lower())
    return netloc in allowed
