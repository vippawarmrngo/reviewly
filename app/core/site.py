"""Serving the single-page site: real URLs for every page, per-page titles and social tags, a sitemap.

The React app is client-rendered, but each public page has its own path (/docs, /status, ...) so it can
be linked, refreshed and indexed. The server answers those paths with the same index.html after filling
in that page's title, description, canonical URL and robots directive. Unknown paths get the same file
with status 404 so the app can show its "not found" page and crawlers learn the URL does not exist.
"""

import html
from pathlib import Path
from typing import Any

from starlette.exceptions import HTTPException
from starlette.responses import HTMLResponse, Response
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

SITE_NAME = "Reviewly"
DEFAULT_DESCRIPTION = (
    "Reviewly reviews every GitHub pull request with AI and posts one focused review with inline "
    "comments and suggested fixes. Bring your own AI key."
)

# path -> (title, description, indexable)
PAGES: dict[str, tuple[str, str, bool]] = {
    "/": ("Reviewly · AI code review for GitHub pull requests", DEFAULT_DESCRIPTION, True),
    "/privacy": (
        "Data handling · Reviewly",
        "What Reviewly sends to an AI model, what it stores, and what it deletes.",
        True,
    ),
    "/signin": ("Sign in · Reviewly", DEFAULT_DESCRIPTION, False),
    "/app": ("Overview · Reviewly", DEFAULT_DESCRIPTION, False),
    "/app/settings": ("Settings · Reviewly", DEFAULT_DESCRIPTION, False),
}
NOT_FOUND = ("Page not found · Reviewly", DEFAULT_DESCRIPTION, False)

# Paths owned by the API and the platform: never answered with the site.
RESERVED_PREFIXES = (
    "/api",
    "/auth",
    "/webhooks",
    "/metrics",
    "/assets",
    "/setup",
    "/healthz",
    "/readyz",
)


def normalize(path: str) -> str:
    clean = path.strip("/")
    if clean in ("", ".", "index.html"):  # Starlette hands the site root over as "."
        return "/"
    return "/" + clean


def is_reserved(route: str) -> bool:
    return any(route == p or route.startswith(p + "/") for p in RESERVED_PREFIXES)


def is_page(route: str) -> bool:
    """A path the site answers with HTML (a known page, or an unknown one that gets the 404 page)."""
    if route in PAGES:
        return True
    return not is_reserved(route) and "." not in route.rsplit("/", 1)[-1]


def indexable_paths() -> list[str]:
    return [p for p, (_, _, indexable) in PAGES.items() if indexable]


def render_index(template: str, public_url: str, route: str) -> str:
    title, description, indexable = PAGES.get(route, NOT_FOUND)
    base = public_url.rstrip("/")
    canonical = base + ("/" if route == "/" else route)
    values = {
        "__TITLE__": title,
        "__DESCRIPTION__": description,
        "__CANONICAL__": canonical if route in PAGES else base + "/",
        "__OG_IMAGE__": f"{base}/og.png",
        "__ROBOTS__": "index, follow" if indexable else "noindex, nofollow",
    }
    for key, value in values.items():
        template = template.replace(key, html.escape(value, quote=True))
    return template


def robots_txt(public_url: str) -> str:
    base = public_url.rstrip("/")
    return (
        "User-agent: *\nAllow: /$\nAllow: /privacy\n"
        "Disallow: /api/\nDisallow: /auth/\nDisallow: /webhooks/\nDisallow: /setup\nDisallow: /app\n"
        f"Sitemap: {base}/sitemap.xml\n"
    )


def sitemap_xml(public_url: str) -> str:
    base = public_url.rstrip("/")
    urls = "".join(
        f"  <url><loc>{html.escape(base + ('/' if p == '/' else p))}</loc></url>\n"
        for p in indexable_paths()
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n"
    )


class SiteFiles(StaticFiles):
    """The built dashboard: hashed assets from disk, and index.html for every page path."""

    def __init__(self, *, directory: Path, public_url: str, **kwargs: Any) -> None:
        super().__init__(directory=directory, **kwargs)
        self._template = (Path(directory) / "index.html").read_text()
        self._public_url = public_url

    def _page(self, route: str, status: int) -> Response:
        return HTMLResponse(
            render_index(self._template, self._public_url, route), status_code=status
        )

    async def get_response(self, path: str, scope: Scope) -> Response:
        if scope["method"] not in ("GET", "HEAD"):
            raise HTTPException(status_code=405)
        route = normalize(path)
        if route in PAGES:
            return self._page(route, 200)
        if is_page(route):
            return self._page(route, 404)
        return await super().get_response(path, scope)  # a real file (or a 404 for a missing one)
