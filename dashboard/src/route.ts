import { useCallback, useEffect, useState } from "react";

/** Public pages (home, privacy, signin) and the signed-in app (overview, settings). */
export type Route = "home" | "privacy" | "signin" | "overview" | "settings";

/** The view is chosen by the URL hash so a reload or a shared link lands on the same page. */
export function parseRoute(hash: string): Route {
  switch (hash) {
    case "#/overview":
      return "overview";
    case "#/settings":
      return "settings";
    case "#/privacy":
      return "privacy";
    case "#/signin":
      return "signin";
    default:
      return "home";
  }
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const go = useCallback((r: Route) => {
    window.location.hash = r === "home" ? "#/" : `#/${r}`;
  }, []);
  return [route, go];
}

/** Scroll to a section of the landing page, going there first if we are on another page. */
export function goToSection(id: string): void {
  const scroll = () => document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  if (parseRoute(window.location.hash) === "home") {
    scroll();
    return;
  }
  window.location.hash = "#/";
  window.setTimeout(scroll, 60);
}
