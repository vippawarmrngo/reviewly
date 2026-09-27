import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import behavior from "../../content/behavior.json";
import { CHANGELOG } from "../../content/changelog";
import providers from "../../content/providers.json";
import Changelog, { formatDate } from "./Changelog";
import Docs, { DOC_SECTIONS, SKIP_MEANINGS } from "./Docs";
import Status, { readStatus } from "./Status";
import { CodeBlock } from "../docs/CodeBlock";

let observers: FakeObserver[] = [];
class FakeObserver {
  constructor(public cb: IntersectionObserverCallback) {
    observers.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Docs", () => {
  it("has a contents list that links to every section, and every section exists", () => {
    const { container } = render(<Docs />);
    const toc = screen.getByRole("complementary", { name: "On this page" });
    for (const [id, label] of DOC_SECTIONS) {
      expect(within(toc).getByRole("link", { name: label })).toHaveAttribute("href", `#${id}`);
      expect(container.querySelector(`h2#${id}`)).not.toBeNull();
    }
  });

  it("highlights the section being read", async () => {
    observers = [];
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    render(<Docs />);
    await act(async () => {
      observers.forEach((o) => o.cb([{ target: document.getElementById("config")!, isIntersecting: true, intersectionRatio: 1 } as unknown as IntersectionObserverEntry], o as unknown as IntersectionObserver));
    });
    expect(screen.getByRole("link", { name: "Configuration" })).toHaveAttribute("aria-current", "location");
  });

  it("shows the reply words and reactions from the shared behavior file", () => {
    render(<Docs />);
    const table = screen.getByRole("heading", { name: "Teaching Reviewly" }).parentElement!;
    for (const w of [...behavior.accept_words, ...behavior.dismiss_words]) expect(within(table).getAllByText(w).length).toBeGreaterThan(0);
    for (const r of [...behavior.positive_reactions, ...behavior.negative_reactions]) expect(table.textContent).toContain(r);
  });

  it("explains strictness the right way round, with the real numbers", () => {
    render(<Docs />);
    const text = screen.getByText(/Strictness works like a confidence bar/).parentElement!.textContent!;
    expect(text).toMatch(/low.*very sure.*at least 80%/);
    expect(text).toMatch(/medium.*60%/);
    expect(text).toMatch(/high.*less sure.*40%.*more comments/);
  });

  it("shows the example config, limits, and says the base branch is used", () => {
    render(<Docs />);
    expect(screen.getByLabelText(".reviewly.yml example")).toHaveTextContent("strictness: medium");
    expect(screen.getByText(/base branch/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`up to ${behavior.config.ignore_max} patterns`))).toBeInTheDocument();
  });

  it("lists every supported provider, with a key link only where there is one", () => {
    render(<Docs />);
    const section = screen.getByRole("heading", { name: "Use your own AI key" }).parentElement!;
    for (const p of providers) expect(within(section).getByText(p.label)).toBeInTheDocument();
    const links = within(section).getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("https://"));
    expect(links).toHaveLength(providers.filter((p) => p.keyUrl).length);
    for (const a of links) expect(a).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("explains every skip reason in plain words", () => {
    render(<Docs />);
    for (const reason of behavior.skip_reasons) {
      expect(SKIP_MEANINGS[reason], reason).toBeTruthy();
      expect(screen.getByText(reason)).toBeInTheDocument();
    }
  });
});

describe("CodeBlock", () => {
  it("copies the text and confirms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<CodeBlock code="a: 1" label="sample" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy sample" }));
    expect(writeText).toHaveBeenCalledWith("a: 1");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("offers no copy button where the browser cannot copy", () => {
    vi.stubGlobal("navigator", {});
    render(<CodeBlock code="a: 1" label="sample" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByLabelText("sample")).toHaveTextContent("a: 1");
  });

  it("does not break if copying is refused", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<CodeBlock code="a: 1" label="sample" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy sample" }));
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });
});

describe("Changelog", () => {
  it("lists every entry, newest first, with its items", () => {
    render(<Changelog />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(CHANGELOG.map((e) => e.title));
    for (const entry of CHANGELOG) for (const item of entry.items) expect(screen.getByText(item)).toBeInTheDocument();
  });

  it("uses real, ordered, unique data", () => {
    const dates = CHANGELOG.map((e) => e.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(new Set(CHANGELOG.map((e) => e.title)).size).toBe(CHANGELOG.length);
    for (const e of CHANGELOG) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.items.length).toBeGreaterThan(0);
    }
  });

  it("formats dates the same in every timezone", () => {
    expect(formatDate("2026-09-05")).toBe("Sep 5, 2026");
  });

  it("does not pretend to have version numbers or a public release", () => {
    render(<Changelog />);
    expect(screen.getByText(/has not been announced as a hosted service yet/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\bv\d+\.\d+/);
  });
});

describe("Status", () => {
  const readyz = (body: unknown, status = 200) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it("reports all systems operational when both checks pass", async () => {
    vi.stubGlobal("fetch", readyz({ db: "ok", redis: "ok" }));
    render(<Status />);
    expect(await screen.findByText("All systems operational")).toBeInTheDocument();
    expect(screen.getAllByText("Operational")).toHaveLength(2);
    expect(screen.getByText(/Last checked/)).toBeInTheDocument();
  });

  it("names the component that is down (a 503 still carries the answer)", async () => {
    vi.stubGlobal("fetch", readyz({ db: "down", redis: "ok" }, 503));
    render(<Status />);
    expect(await screen.findByText("Some systems are having problems")).toBeInTheDocument();
    const db = screen.getByText("Database").closest("li")!;
    expect(within(db).getByText("Down")).toBeInTheDocument();
    expect(within(screen.getByText("Queue and cache").closest("li")!).getByText("Operational")).toBeInTheDocument();
  });

  it("says so when the service cannot be reached at all", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    render(<Status />);
    expect(await screen.findByText("Could not reach the service")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown")).toHaveLength(2);
  });

  it("checks again on request", async () => {
    const fetchMock = readyz({ db: "ok", redis: "ok" });
    vi.stubGlobal("fetch", fetchMock);
    render(<Status />);
    await screen.findByText("All systems operational");
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("re-checks on its own while the tab is visible, and never asks for a cached answer", async () => {
    const fetchMock = readyz({ db: "ok", redis: "ok" });
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    render(<Status />);
    await screen.findByText("All systems operational");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });

  it("makes no uptime claim", async () => {
    vi.stubGlobal("fetch", readyz({ db: "ok", redis: "ok" }));
    render(<Status />);
    await screen.findByText("All systems operational");
    expect(screen.getByText(/does not record history or uptime figures/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\d\d(\.\d+)?% uptime/i);
  });

  it("treats an unexpected answer as down rather than fine", async () => {
    vi.stubGlobal("fetch", readyz({ db: "ok" })); // redis missing from the answer
    expect((await readStatus()) as { checks: Record<string, string> }).toMatchObject({ checks: { db: "ok", redis: "down" } });
  });
});
