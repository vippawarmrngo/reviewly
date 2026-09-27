import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Unauthorized, fetchConfig, fetchLLM, fetchMe, fetchOverview } from "./api";
import { Header } from "./components/Header";
import { Icon } from "./components/Icon";
import { Login } from "./components/Login";
import { Link } from "./components/Link";
import { ToastProvider, useToast } from "./components/Toast";
import { Landing } from "./components/site/Landing";
import { NotFound } from "./components/site/NotFound";
import { SiteFooter } from "./components/site/SiteFooter";
import { SiteHeader } from "./components/site/SiteHeader";
import { Skeleton } from "./components/Skeleton";
import { statusOf } from "./components/Tables";

import { PageTransition } from "./motion/PageTransition";
import { type Route, navigate, pathOf, useRoute } from "./route";
import { useTheme } from "./theme";
import type { Me, Overview, PublicConfig } from "./types";

type Session = { kind: "loading" } | { kind: "login" } | { kind: "error"; message: string } | { kind: "ready"; me: Me };

// Information pages load on demand, so the landing page does not carry them.
const Privacy = lazy(() => import("./components/site/Privacy").then((m) => ({ default: m.Privacy })));
const Docs = lazy(() => import("./components/site/Docs"));
const Changelog = lazy(() => import("./components/site/Changelog"));
const Status = lazy(() => import("./components/site/Status"));
const Dashboard = lazy(() => import("./views/Dashboard"));

const INFO_PAGES: Partial<Record<Route, React.ReactNode>> = {
  privacy: <Privacy />,
  docs: <Docs />,
  changelog: <Changelog />,
  status: <Status />,
};
const Loading = () => (
  <div className="center" role="status" aria-live="polite">
    <p>Loading…</p>
  </div>
);

const AUTO_REFRESH_MS = 20_000;
const SUBTITLES = {
  overview: (name?: string) => (name ? `How Reviewly is doing on ${name}'s repositories.` : "How Reviewly is doing on your repositories."),
  settings: () => "Your plan, usage, and which AI model reviews your code.",
} as const;
const TITLES: Record<Route, string> = {
  home: "Reviewly · AI code review for GitHub pull requests",
  docs: "Docs · Reviewly",
  changelog: "Changelog · Reviewly",
  status: "Status · Reviewly",
  privacy: "Data handling · Reviewly",
  signin: "Sign in · Reviewly",
  overview: "Overview · Reviewly",
  settings: "Settings · Reviewly",
  notfound: "Page not found · Reviewly",
};

function AppInner() {
  const [theme, toggleTheme] = useTheme();
  const [route] = useRoute();
  const [session, setSession] = useState<Session>({ kind: "loading" });
  const [installation, setInstallation] = useState<number | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [ownKey, setOwnKey] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const installUrl = config?.app_install_url ?? null;

  // Signed-in people never see the marketing page or the sign-in form; signed-out people never see the app.
  const signedInNow = session.kind === "ready";
  const view: Route = signedInNow
    ? route === "home" || route === "signin"
      ? "overview"
      : route
    : session.kind === "login" && (route === "overview" || route === "settings")
      ? "signin"
      : route;

  useEffect(() => {
    document.title = session.kind === "loading" ? "Reviewly" : TITLES[view];
  }, [view, session.kind]);

  // Keep the address bar honest when the view differs from the URL (signed-in "/" -> "/app", signed-out "/app" -> "/signin").
  useEffect(() => {
    if (session.kind === "loading" || session.kind === "error") return;
    if (view !== route && view !== "notfound") navigate(pathOf(view), { replace: true, silent: true });
  }, [view, route, session.kind]);

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch(() => setConfig(null)); // optional: the page works without it
    fetchMe()
      .then((me) => {
        setSession({ kind: "ready", me });
        setInstallation(me.installations[0] ?? null);
      })
      .catch((e) => setSession(e instanceof Unauthorized ? { kind: "login" } : { kind: "error", message: String(e.message ?? e) }));
  }, []);

  const load = useCallback(async (id: number): Promise<boolean> => {
    setError(null);
    setRefreshing(true);
    try {
      setOverview(await fetchOverview(id));
      setUpdatedAt(new Date());
      return true;
    } catch (e) {
      if (e instanceof Unauthorized) setSession({ kind: "login" });
      else setError(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setRefreshing(false);
    }
  }, []);

  const toast = useToast();
  /** The Refresh button: reload, then say how it went without moving the page. */
  const refresh = useCallback(async () => {
    if (installation === null) return;
    const ok = await load(installation);
    toast(ok ? "Dashboard updated" : "Could not refresh. Try again.", ok ? "ok" : "error");
  }, [installation, load, toast]);

  useEffect(() => {
    if (installation === null) return;
    setOverview(null);
    setOwnKey(false);
    void load(installation);
    fetchLLM(installation)
      .then((s) => setOwnKey(s.configured && s.enabled))
      .catch(() => undefined); // only decides whether a checklist step shows as done
  }, [installation, load]);

  // Move keyboard/screen-reader focus to the new view when the user navigates (not on first load).
  const mainRef = useRef<HTMLElement>(null);
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    mainRef.current?.focus();
    window.scrollTo?.(0, 0);
  }, [route]); // the user's navigation, not the session settling (which also changes `view`)

  // While a review is still running, keep the table current without the user pressing Refresh.
  const inProgress = overview?.recent.some((r) => statusOf(r).cls === "queued") ?? false;
  useEffect(() => {
    if (!inProgress || installation === null) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(installation);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [inProgress, installation, load]);

  const signedIn = session.kind === "ready";
  const hasInstallation = signedIn && installation !== null;
  const appShell = (body: React.ReactNode) => (
    <div className="page">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header
        installations={signedIn ? session.me.installations : []}
        names={signedIn ? session.me.names : undefined}
        selected={installation}
        onSelect={setInstallation}
        theme={theme}
        onToggleTheme={toggleTheme}
        signedIn={signedIn}
        login={signedIn ? session.me.login : undefined}
        route={view}
        showNav={hasInstallation}
      />
      <main id="main" tabIndex={-1} ref={mainRef}>
        <PageTransition pageKey={view}>
          <Suspense fallback={<Loading />}>{body}</Suspense>
        </PageTransition>
      </main>
      <footer className="footer">
        <span>Reviewly</span>
        <Link className="inline-link" to="/docs">Docs</Link>
        <Link className="inline-link" to="/changelog">Changelog</Link>
        <Link className="inline-link" to="/status">Status</Link>
        <Link className="inline-link" to="/privacy">Data handling</Link>
        <a className="inline-link" href="https://github.com/vipawar1104/reviewly" target="_blank" rel="noopener noreferrer">
          Source <Icon name="external-link" size={11} />
        </a>
      </footer>
    </div>
  );

  const publicShell = (body: React.ReactNode) => (
    <div className="site-page">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SiteHeader theme={theme} onToggleTheme={toggleTheme} installUrl={installUrl} />
      <main id="main" tabIndex={-1} ref={mainRef}>
        <PageTransition pageKey={view}>
          <Suspense fallback={<Loading />}>{body}</Suspense>
        </PageTransition>
      </main>
      <SiteFooter installUrl={installUrl} />
    </div>
  );

  if (session.kind === "loading") return appShell(<Skeleton />);
  if (session.kind === "error") {
    return publicShell(
      <div className="error" role="alert">
        <span>Could not reach the server: {session.message}</span>
        <button className="btn" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>,
    );
  }
  if (session.kind === "login") {
    const page =
      INFO_PAGES[view] ?? (view === "signin" ? <Login config={config} /> : view === "notfound" ? <NotFound signedIn={false} /> : <Landing config={config} installUrl={installUrl} />);
    return publicShell(page);
  }
  if (INFO_PAGES[view]) return appShell(INFO_PAGES[view]);
  if (view === "notfound") return appShell(<NotFound signedIn />);
  if (installation === null) {
    return appShell(
      <div className="center">
        <h1>No installations yet</h1>
        <p>Install the Reviewly GitHub App on a repository, and it will show up here after its first review.</p>
        {installUrl && (
          <a className="btn primary" href={installUrl} style={{ textDecoration: "none", padding: "8px 14px" }}>
            <Icon name="plus" size={15} />
            Install on GitHub
          </a>
        )}
      </div>,
    );
  }

  const appView = view === "settings" ? "settings" : "overview";
  return appShell(
    <>
      {error && (
        <div className="error" role="alert">
          <span>Could not load data: {error}</span>
          <button className="btn" onClick={() => void load(installation)}>
            Try again
          </button>
        </div>
      )}
      {!overview && !error && <Skeleton />}

      {overview && (
        <Dashboard
          overview={overview}
          view={appView}
          subtitle={SUBTITLES[appView](signedIn ? session.me.names?.[String(installation)] : undefined)}
          updatedAt={updatedAt}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          ownKey={ownKey}
          onOwnKeyChange={setOwnKey}
          installUrl={installUrl}
          billing={config?.billing ?? false}
        />
      )}
    </>,
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
