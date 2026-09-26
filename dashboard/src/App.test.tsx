import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { navigate } from "./route";
import { llmNone, overview } from "./fixtures";

function mockApi(routes: Record<string, () => Response | Promise<Response>>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${String(input)}`;
    const handler = routes[key];
    return handler ? handler() : new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  delete document.documentElement.dataset.theme;
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => vi.unstubAllGlobals());

const loggedIn = {
  "GET /api/config": () => json({ app_install_url: null, github_login: true, dev_login: false }),
  "GET /api/installations/42/llm": () => json(llmNone),
  "GET /api/session": () => json({ login: "octocat", installations: [42] }),
  "GET /api/installations/42/overview": () => json(overview),
};

describe("signed out", () => {
  it("shows the sign-in screen when the API says 401", async () => {
    window.history.replaceState(null, "", "/signin");
    mockApi({ "GET /api/session": () => json({ signed_in: false }) });
    render(<App />);
    const link = await screen.findByRole("link", { name: /sign in with github/i });
    expect(link).toHaveAttribute("href", "/auth/github/login");
    expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument();
  });

  it("shows a retry when the server is unreachable, not the login screen", async () => {
    mockApi({ "GET /api/session": () => new Response("bad gateway", { status: 502, statusText: "Bad Gateway" }) });
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach the server/i);
    expect(screen.queryByRole("link", { name: /sign in with github/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: /catch bugs/i })).not.toBeInTheDocument();
  });
});

describe("signed in", () => {
  it("shows the summary numbers", async () => {
    mockApi(loggedIn);
    render(<App />);
    const summary = await screen.findByRole("region", { name: "Summary" });
    expect(within(summary).getByText("Reviews").nextSibling).toHaveTextContent("12");
    expect(within(summary).getByText("Precision").nextSibling).toHaveTextContent("74%");
    expect(within(summary).getByText("Tokens").nextSibling).toHaveTextContent("45K");
    expect(within(summary).getByText("Cost").nextSibling).toHaveTextContent("n/a");
  });

  it("shows precision per rule, and a dash instead of 0% when nothing is judged", async () => {
    mockApi(loggedIn);
    render(<App />);
    const rules = await screen.findByRole("region", { name: "Precision by rule" });
    expect(within(rules).getByText("bug")).toBeInTheDocument();
    expect(within(rules).getByText("83%")).toBeInTheDocument();
    expect(within(rules).getByText("—")).toBeInTheDocument();
    expect(within(rules).getByText(/7 not judged yet/)).toBeInTheDocument();
    expect(within(rules).getByRole("meter", { name: "bug precision" })).toHaveAttribute("aria-valuenow", "83");
  });

  it("shows the plan, its meter and the upgrade button", async () => {
    window.history.replaceState(null, "", "/app/settings");
    mockApi(loggedIn);
    render(<App />);
    const plan = await screen.findByRole("region", { name: "Plan" });
    expect(within(plan).getByText(/3 of 20 reviews used in Sep 2026/)).toBeInTheDocument();
    expect(within(plan).getByRole("meter")).toHaveAttribute("aria-valuenow", "15");
    expect(within(plan).getByRole("button", { name: "Upgrade" })).toBeEnabled();
  });

  it("does not offer an upgrade to a paying installation", async () => {
    window.history.replaceState(null, "", "/app/settings");
    mockApi({ ...loggedIn, "GET /api/installations/42/overview": () => json({ ...overview, plan: { name: "pro", limit: null, used: 30 } }) });
    render(<App />);
    expect(await screen.findByText("Pro plan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upgrade" })).not.toBeInTheDocument();
  });

  it("marks statuses with a word, so color is never the only signal", async () => {
    mockApi(loggedIn);
    render(<App />);
    const recent = await screen.findByRole("region", { name: "Recent reviews" });
    expect(within(recent).getByText("Reviewed")).toBeInTheDocument();
    expect(within(recent).getByText("Failed")).toBeInTheDocument();
    expect(within(recent).getByText("Skipped")).toBeInTheDocument();
  });

  it("starts checkout and sends the browser to Stripe", async () => {
    window.history.replaceState(null, "", "/app/settings");
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const fetchMock = mockApi({ ...loggedIn, "POST /api/installations/42/billing/checkout": () => json({ url: "https://checkout.stripe.com/c/x" }) });
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Upgrade" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/x"));
    expect(fetchMock).toHaveBeenCalledWith("/api/installations/42/billing/checkout", expect.objectContaining({ method: "POST" }));
  });

  it("explains when billing is not configured instead of failing silently", async () => {
    window.history.replaceState(null, "", "/app/settings");
    mockApi({ ...loggedIn, "POST /api/installations/42/billing/checkout": () => new Response("", { status: 503 }) });
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Upgrade" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Billing is not set up yet.");
  });

  it("offers a table view of the monthly chart", async () => {
    mockApi(loggedIn);
    render(<App />);
    const usage = await screen.findByRole("region", { name: "Monthly usage" });
    expect(within(usage).getByRole("img")).toHaveAccessibleName(/Sep 2026: 3/);
    await userEvent.click(within(usage).getByRole("button", { name: "Show as table" }));
    expect(within(usage).getByRole("table")).toBeInTheDocument();
    expect(within(usage).getByText("Aug 2026")).toBeInTheDocument();
  });

  it("shows a friendly empty state for a brand-new installation", async () => {
    mockApi({
      ...loggedIn,
      "GET /api/installations/42/overview": () =>
        json({ ...overview, totals: { ...overview.totals, reviews: 0, precision: null }, rules: [], repos: [], recent: [], usage: [] }),
    });
    render(<App />);
    expect(await screen.findByText(/No findings yet/)).toBeInTheDocument();
    expect(screen.getByText("No reviews yet.")).toBeInTheDocument();
    expect(screen.getByText("No feedback yet")).toBeInTheDocument();
  });

  it("returns to the sign-in screen if the session expires mid-use", async () => {
    window.history.replaceState(null, "", "/app");
    mockApi({ ...loggedIn, "GET /api/installations/42/overview": () => new Response("", { status: 401 }) });
    render(<App />);
    expect(await screen.findByRole("link", { name: /sign in with github/i })).toBeInTheDocument();
  });

  it("offers a retry when the data fails to load", async () => {
    let calls = 0;
    mockApi({
      ...loggedIn,
      "GET /api/installations/42/overview": () => (++calls === 1 ? new Response("", { status: 500, statusText: "Server Error" }) : json(overview)),
    });
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not load data/i);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("region", { name: "Summary" })).toBeInTheDocument();
  });

  it("lets a user with several installations switch between them", async () => {
    const fetchMock = mockApi({
      "GET /api/session": () => json({ login: "octocat", installations: [42, 7] }),
      "GET /api/installations/42/overview": () => json(overview),
      "GET /api/installations/42/llm": () => json(llmNone),
      "GET /api/installations/7/llm": () => json(llmNone),
      "GET /api/installations/7/overview": () => json({ ...overview, installation_id: 7, totals: { ...overview.totals, reviews: 99 } }),
    });
    render(<App />);
    await userEvent.selectOptions(await screen.findByRole("combobox", { name: "Installation" }), "7");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/installations/7/overview", expect.anything()));
    const summary = await screen.findByRole("region", { name: "Summary" });
    await waitFor(() => expect(within(summary).getByText("Reviews").nextSibling).toHaveTextContent("99"));
  });

  it("says so when the user has no installations", async () => {
    mockApi({ "GET /api/session": () => json({ login: "octocat", installations: [] }) });
    render(<App />);
    expect(await screen.findByText("No installations yet")).toBeInTheDocument();
  });
});

describe("theme", () => {
  it("starts light, toggles to dark, and remembers the choice", async () => {
    mockApi(loggedIn);
    const { unmount } = render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    expect(document.documentElement.dataset.theme).toBe("light");
    await userEvent.click(screen.getByRole("button", { name: /switch to dark mode/i }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("reviewly-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: /switch to light mode/i })).toHaveTextContent("Light mode");
    unmount();
    mockApi(loggedIn);
    render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("follows the operating system when nothing has been chosen", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
    mockApi(loggedIn);
    render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

describe("onboarding and AI model", () => {
  it("shows the getting-started checklist until the first review", async () => {
    mockApi({
      ...loggedIn,
      "GET /api/installations/42/overview": () => json({ ...overview, totals: { ...overview.totals, reviews: 0, precision: null } }),
    });
    render(<App />);
    expect(await screen.findByRole("region", { name: "Getting started" })).toBeInTheDocument();
  });

  it("hides it once reviews exist, and shows the AI model section under Settings", async () => {
    window.history.replaceState(null, "", "/app/settings");
    mockApi(loggedIn);
    render(<App />);
    await screen.findByRole("region", { name: "Plan" });
    expect(screen.queryByRole("region", { name: "Getting started" })).not.toBeInTheDocument();
    const model = screen.getByRole("region", { name: "AI model" });
    expect(await within(model).findByText("Using Reviewly's built-in models")).toBeInTheDocument();
  });

  it("offers an Install on GitHub button to a user with no installations, when the app URL is configured", async () => {
    mockApi({
      "GET /api/config": () => json({ app_install_url: "https://github.com/apps/reviewly/installations/new", github_login: true, dev_login: false }),
      "GET /api/session": () => json({ login: "octocat", installations: [] }),
    });
    render(<App />);
    expect(await screen.findByRole("link", { name: /install on github/i })).toHaveAttribute("href", "https://github.com/apps/reviewly/installations/new");
  });

  it("still works when the config endpoint is unavailable", async () => {
    mockApi({ ...loggedIn, "GET /api/config": () => new Response("", { status: 500 }) });
    render(<App />);
    expect(await screen.findByRole("region", { name: "Summary" })).toBeInTheDocument();
  });
});

describe("navigation and shell", () => {
  it("opens on Overview and marks it as the current page", async () => {
    mockApi(loggedIn);
    render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Settings" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("region", { name: "AI model" })).not.toBeInTheDocument();
    expect(document.title).toBe("Overview · Reviewly");
  });

  it("switches to Settings when its link is followed, and back", async () => {
    mockApi(loggedIn);
    render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    await act(async () => {
      navigate("/app/settings");
    });
    expect(await screen.findByRole("region", { name: "AI model" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Plan" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Summary" })).not.toBeInTheDocument();
    expect(document.title).toBe("Settings · Reviewly");
    await act(async () => {
      navigate("/app");
    });
    expect(await screen.findByRole("region", { name: "Summary" })).toBeInTheDocument();
  });

  it("shows a not-found page for an unknown address, in the app for a signed-in user", async () => {
    window.history.replaceState(null, "", "/nonsense");
    mockApi(loggedIn);
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to your dashboard" })).toHaveAttribute("href", "/app");
    expect(document.title).toBe("Page not found · Reviewly");
    expect(window.location.pathname).toBe("/nonsense"); // the URL is left alone
  });

  it("shows a not-found page to a signed-out visitor too", async () => {
    window.history.replaceState(null, "", "/nope/deeper");
    mockApi({ "GET /api/session": () => json({ signed_in: false }) });
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the home page" })).toHaveAttribute("href", "/");
  });

  it("puts the address bar on the real page: signed-in / becomes /app, signed-out /app becomes /signin", async () => {
    mockApi(loggedIn);
    const first = render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    await waitFor(() => expect(window.location.pathname).toBe("/app"));
    first.unmount();
    window.history.replaceState(null, "", "/app/settings");
    mockApi({ "GET /api/session": () => json({ signed_in: false }) });
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Sign in to Reviewly" });
    await waitFor(() => expect(window.location.pathname).toBe("/signin"));
  });

  it("navigates without a page load and follows the back button", async () => {
    mockApi(loggedIn);
    render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    await userEvent.click(within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name: "Settings" }));
    expect(await screen.findByRole("region", { name: "AI model" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/app/settings");
    await act(async () => {
      window.history.back();
    });
    expect(await screen.findByRole("region", { name: "Summary" })).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it("shows no navigation to a signed-out visitor", async () => {
    mockApi({ "GET /api/session": () => json({ signed_in: false }) });
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: /catch bugs/i });
    expect(screen.queryByRole("navigation", { name: "Main" })).not.toBeInTheDocument();
  });

  it("has a skip link, a main landmark and shows who is signed in", async () => {
    mockApi(loggedIn);
    render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
    expect(screen.getByText("octocat")).toBeInTheDocument();
  });

  it("shows a loading placeholder, not a blank page, while data loads", async () => {
    let release: (r: Response) => void = () => undefined;
    mockApi({ ...loggedIn, "GET /api/installations/42/overview": () => new Promise<Response>((r) => (release = r)) });
    render(<App />);
    expect(await screen.findByRole("status")).toHaveTextContent(/loading your dashboard/i);
    release(json(overview));
    expect(await screen.findByRole("region", { name: "Summary" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("refreshes on demand and says when it last updated", async () => {
    let calls = 0;
    mockApi({
      ...loggedIn,
      "GET /api/installations/42/overview": () => json({ ...overview, totals: { ...overview.totals, reviews: 12 + calls++ } }),
    });
    render(<App />);
    const summary = await screen.findByRole("region", { name: "Summary" });
    expect(within(summary).getByText("Reviews").nextSibling).toHaveTextContent("12");
    expect(screen.getByText(/Updated just now/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Refresh data" }));
    await waitFor(() => expect(within(summary).getByText("Reviews").nextSibling).toHaveTextContent("13"));
  });

  it("links each pull request to GitHub, safely", async () => {
    mockApi(loggedIn);
    render(<App />);
    const recent = await screen.findByRole("region", { name: "Recent reviews" });
    const link = within(recent).getByRole("link", { name: "acme/widgets#12" });
    expect(link).toHaveAttribute("href", "https://github.com/acme/widgets/pull/12");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("marks the checklist's key step done when the installation already uses its own key", async () => {
    mockApi({
      ...loggedIn,
      "GET /api/installations/42/overview": () => json({ ...overview, totals: { ...overview.totals, reviews: 0, precision: null } }),
      "GET /api/installations/42/llm": () => json({ ...llmNone, configured: true, enabled: true, provider: "openai", model: "gpt-4.1" }),
    });
    const { container } = render(<App />);
    await screen.findByRole("region", { name: "Getting started" });
    await waitFor(() => expect(container.querySelectorAll("li.done")).toHaveLength(2));
  });
});

describe("production behaviour", () => {
  const running = { ...overview, recent: [{ ...overview.recent[0], status: "queued", note: null }] };

  it("names installations after their account instead of a bare number", async () => {
    mockApi({
      ...loggedIn,
      "GET /api/session": () => json({ login: "octocat", installations: [42, 7], names: { "42": "acme" } }),
      "GET /api/installations/7/llm": () => json(llmNone),
    });
    render(<App />);
    const picker = await screen.findByRole("combobox", { name: "Installation" });
    expect(within(picker).getByRole("option", { name: "acme" })).toBeInTheDocument();
    expect(within(picker).getByRole("option", { name: "Installation 7" })).toBeInTheDocument();
  });

  it("shows the account name for a user with a single installation", async () => {
    mockApi({ ...loggedIn, "GET /api/session": () => json({ login: "octocat", installations: [42], names: { "42": "acme" } }) });
    render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    expect(screen.getByText("acme")).toBeInTheDocument();
  });

  it("keeps a running review current by refreshing on its own", async () => {
    let calls = 0;
    mockApi({ ...loggedIn, "GET /api/installations/42/overview": () => json(++calls === 1 ? running : overview) });
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      render(<App />);
      const recent = await screen.findByRole("region", { name: "Recent reviews" });
      expect(within(recent).getByText("In progress")).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(20_000);
      await waitFor(() => expect(within(recent).queryByText("In progress")).not.toBeInTheDocument());
      const after = calls;
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls).toBe(after); // nothing is running any more: polling stops
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not poll when nothing is running", async () => {
    let calls = 0;
    mockApi({ ...loggedIn, "GET /api/installations/42/overview": () => (calls++, json(overview)) });
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      render(<App />);
      await screen.findByRole("region", { name: "Summary" });
      await vi.advanceTimersByTimeAsync(120_000);
      expect(calls).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("moves focus to the page content when the view changes", async () => {
    mockApi(loggedIn);
    render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    expect(screen.getByRole("main")).not.toHaveFocus(); // not stolen on first load
    await act(async () => {
      navigate("/app/settings");
    });
    await screen.findByRole("region", { name: "AI model" });
    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
  });
});

describe("look and feel", () => {
  it("colours precision by how good it is, with the number beside it", async () => {
    mockApi(loggedIn);
    render(<App />);
    const rules = await screen.findByRole("region", { name: "Precision by rule" });
    expect(within(rules).getByRole("meter", { name: "bug precision" })).toHaveClass("good"); // 83%
    expect(within(rules).getByText("83%")).toBeInTheDocument();
  });

  it("marks a plan that is nearly used up", async () => {
    window.history.replaceState(null, "", "/app/settings");
    mockApi({ ...loggedIn, "GET /api/installations/42/overview": () => json({ ...overview, plan: { name: "free", limit: 20, used: 19 } }) });
    render(<App />);
    const plan = await screen.findByRole("region", { name: "Plan" });
    expect(within(plan).getByRole("meter")).toHaveClass("warn");
  });

  it("gives the page a plain-language subtitle that names the account", async () => {
    mockApi({ ...loggedIn, "GET /api/session": () => json({ login: "octocat", installations: [42], names: { "42": "acme" } }) });
    render(<App />);
    expect(await screen.findByText("How Reviewly is doing on acme's repositories.")).toBeInTheDocument();
  });

  it("tints accepted green and dismissed red, in addition to their labels", async () => {
    mockApi(loggedIn);
    render(<App />);
    const summary = await screen.findByRole("region", { name: "Summary" });
    expect(within(summary).getByText("Accepted").previousSibling).toHaveClass("good");
    expect(within(summary).getByText("Dismissed").previousSibling).toHaveClass("bad");
  });
});

describe("public site", () => {
  it("shows the landing page to a signed-out visitor and sets the page title", async () => {
    mockApi({ "GET /api/session": () => json({ signed_in: false }) });
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: /catch bugs/i })).toBeInTheDocument();
    expect(document.title).toMatch(/AI code review for GitHub pull requests/);
    expect(screen.getByRole("navigation", { name: "Sections" })).toBeInTheDocument();
  });

  it("shows the data-handling page at #/privacy, signed in or not", async () => {
    window.history.replaceState(null, "", "/privacy");
    mockApi({ "GET /api/session": () => json({ signed_in: false }) });
    const first = render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: "Data handling" })).toBeInTheDocument();
    first.unmount();
    mockApi(loggedIn);
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: "Data handling" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument(); // inside the app shell
  });

  it("never shows the marketing page to a signed-in user", async () => {
    mockApi(loggedIn);
    render(<App />);
    await screen.findByRole("region", { name: "Summary" });
    expect(screen.queryByRole("heading", { level: 1, name: /catch bugs/i })).not.toBeInTheDocument();
  });

  it("does not show the app to a signed-out visitor who opens a dashboard link", async () => {
    window.history.replaceState(null, "", "/app/settings");
    mockApi({ "GET /api/session": () => json({ signed_in: false }) });
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: "Sign in to Reviewly" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "AI model" })).not.toBeInTheDocument();
  });
});
