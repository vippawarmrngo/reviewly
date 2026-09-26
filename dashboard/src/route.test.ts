import { migrateLegacyHash, navigate, parseRoute, pathOf } from "./route";

describe("parseRoute", () => {
  it.each([
    ["/", "home"],
    ["/privacy", "privacy"],
    ["/signin", "signin"],
    ["/app", "overview"],
    ["/app/", "overview"],
    ["/app/settings", "settings"],
    ["/app/settings//", "settings"],
    ["/nonsense", "notfound"],
    ["/app/settings/extra", "notfound"],
    ["/<script>", "notfound"],
    ["/APP", "notfound"],
  ])("%j -> %s", (path, expected) => {
    expect(parseRoute(path)).toBe(expected);
  });

  it("round-trips every real page", () => {
    for (const r of ["home", "privacy", "signin", "overview", "settings"] as const) expect(parseRoute(pathOf(r))).toBe(r);
  });
});

describe("navigate", () => {
  beforeEach(() => window.history.replaceState(null, "", "/"));

  it("changes the URL and tells listeners, without reloading", () => {
    const seen = vi.fn();
    window.addEventListener("reviewly:navigate", seen);
    navigate("/privacy");
    expect(window.location.pathname).toBe("/privacy");
    expect(seen).toHaveBeenCalledTimes(1);
    window.removeEventListener("reviewly:navigate", seen);
  });

  it("does nothing when already there, and can replace instead of push", () => {
    const seen = vi.fn();
    window.addEventListener("reviewly:navigate", seen);
    navigate("/");
    expect(seen).not.toHaveBeenCalled();
    const before = window.history.length;
    navigate("/signin", { replace: true });
    expect(window.history.length).toBe(before);
    window.removeEventListener("reviewly:navigate", seen);
  });
});

describe("migrateLegacyHash", () => {
  it.each([
    ["#/overview", "/app"],
    ["#/settings", "/app/settings"],
    ["#/privacy", "/privacy"],
    ["#/signin", "/signin"],
  ])("old link %s lands on %s", (hash, path) => {
    window.history.replaceState(null, "", "/" + hash);
    migrateLegacyHash();
    expect(window.location.pathname).toBe(path);
  });

  it("leaves unknown fragments and other paths alone", () => {
    window.history.replaceState(null, "", "/#/whatever");
    migrateLegacyHash();
    expect(window.location.pathname).toBe("/");
    window.history.replaceState(null, "", "/privacy#/settings");
    migrateLegacyHash();
    expect(window.location.pathname).toBe("/privacy");
  });
});

describe("navigate silently", () => {
  it("updates the address without announcing a navigation", () => {
    window.history.replaceState(null, "", "/");
    const seen = vi.fn();
    window.addEventListener("reviewly:navigate", seen);
    navigate("/app", { replace: true, silent: true });
    expect(window.location.pathname).toBe("/app");
    expect(seen).not.toHaveBeenCalled();
    window.removeEventListener("reviewly:navigate", seen);
  });
});
