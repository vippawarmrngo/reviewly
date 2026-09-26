import { useCallback, useEffect, useState } from "react";

/** Public pages, and the signed-in app (overview, settings). */
export type Route = "home" | "privacy" | "signin" | "overview" | "settings" | "notfound";

/** Real URL paths, so every page can be linked, refreshed and indexed. The server answers all of them. */
export const PATHS: Record<Exclude<Route, "notfound">, string> = {
  home: "/",
  privacy: "/privacy",
  signin: "/signin",
  overview: "/app",
  settings: "/app/settings",
};

const BY_PATH = new Map<string, Route>(Object.entries(PATHS).map(([route, path]) => [path, route as Route]));

export function parseRoute(pathname: string): Route {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return BY_PATH.get(clean) ?? "notfound";
}

export function pathOf(route: Route): string {
  return route === "notfound" ? "/" : PATHS[route];
}

const NAVIGATE_EVENT = "reviewly:navigate";

/** Client-side navigation: change the URL without a page load. */
export function navigate(to: string, opts: { replace?: boolean; silent?: boolean } = {}): void {
  if (to === window.location.pathname + window.location.search) return;
  if (opts.replace) window.history.replaceState(null, "", to);
  else window.history.pushState(null, "", to);
  // `silent` tidies the address bar without announcing a navigation (no focus move, no scroll reset).
  if (!opts.silent) window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

/** Old links looked like /#/settings. Send them to the real path once, so bookmarks keep working. */
const LEGACY: Record<string, string> = {
  "#/": "/",
  "#/overview": "/app",
  "#/settings": "/app/settings",
  "#/privacy": "/privacy",
  "#/signin": "/signin",
};
export function migrateLegacyHash(): void {
  const target = LEGACY[window.location.hash];
  if (target && window.location.pathname === "/") window.history.replaceState(null, "", target);
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));
  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", sync);
    window.addEventListener(NAVIGATE_EVENT, sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(NAVIGATE_EVENT, sync);
    };
  }, []);
  const go = useCallback((r: Route) => navigate(pathOf(r)), []);
  return [route, go];
}

/** Scroll to a section of the landing page, going there first if we are on another page. */
export function goToSection(id: string): void {
  const scroll = () => document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  if (parseRoute(window.location.pathname) === "home") {
    scroll();
    return;
  }
  navigate("/");
  window.setTimeout(scroll, 80);
}
