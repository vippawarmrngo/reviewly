import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProofStrip } from "./sections/ProofStrip";
import { Accordion } from "./sections/Accordion";
import { Features, configPreview } from "./sections/Features";
import { ReviewFrame, ReviewPreview, STEP_MS } from "./ReviewPreview";
import { SiteHeader } from "./SiteHeader";
import { MotionProvider } from "../../motion/MotionProvider";

const pref = vi.hoisted(() => ({ reduce: false }));
vi.mock("framer-motion", async (orig) => ({ ...(await orig<typeof import("framer-motion")>()), useReducedMotion: () => pref.reduce }));

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
  emit(entries: Partial<IntersectionObserverEntry>[]) {
    this.cb(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}
function withObserver() {
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
}

beforeEach(() => {
  pref.reduce = false;
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const wrap = (ui: React.ReactNode) => render(<MotionProvider>{ui}</MotionProvider>);

describe("Accordion", () => {
  const items = [
    { q: "First?", a: "Answer one." },
    { q: "Second?", a: "Answer two." },
  ];

  it("starts closed, with each header wired to its panel", () => {
    render(<Accordion items={items} />);
    const first = screen.getByRole("button", { name: "First?" });
    expect(first).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(first.getAttribute("aria-controls")!)!;
    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-labelledby", first.id);
  });

  it("opens and closes with the mouse and the keyboard, and lets several stay open", async () => {
    render(<Accordion items={items} />);
    const [a, b] = screen.getAllByRole("button");
    await userEvent.click(a);
    expect(a).toHaveAttribute("aria-expanded", "true");
    b.focus();
    await userEvent.keyboard("{Enter}");
    expect(b).toHaveAttribute("aria-expanded", "true");
    expect(a).toHaveAttribute("aria-expanded", "true"); // opening one does not close the other
    await userEvent.click(a);
    expect(a).toHaveAttribute("aria-expanded", "false");
    expect(a.closest(".acc")).toHaveAttribute("data-open", "false");
  });

  it("keeps the answers in the page for search and screen readers even when closed", () => {
    render(<Accordion items={items} />);
    expect(screen.getByText("Answer one.")).toBeInTheDocument();
  });
});

describe("SiteHeader mobile menu", () => {
  const header = () => render(<SiteHeader theme="light" onToggleTheme={() => undefined} installUrl="https://github.com/apps/x/installations/new" />);

  it("is closed at first and announces its state", () => {
    header();
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "mobile-menu");
    expect(document.getElementById("mobile-menu")).toHaveAttribute("hidden");
  });

  it("opens with every section link, sign in and install", async () => {
    header();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = document.getElementById("mobile-menu")!;
    expect(menu).not.toHaveAttribute("hidden");
    for (const name of ["How it works", "Features", "Security", "Pricing", "FAQ", "Sign in", "Install on GitHub"]) {
      expect(within(menu).getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape and returns focus to the button that opened it", async () => {
    header();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await userEvent.keyboard("{Escape}");
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("closes when a link is chosen, and scrolls to that section", async () => {
    const scroll = vi.fn();
    const el = document.createElement("div");
    el.id = "pricing";
    el.scrollIntoView = scroll;
    document.body.appendChild(el);
    header();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await userEvent.click(within(document.getElementById("mobile-menu")!).getByRole("link", { name: "Pricing" }));
    expect(scroll).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
    el.remove();
  });

  it("gives the header a shadow only after the page has scrolled", async () => {
    const { container } = header();
    const el = container.querySelector("header")!;
    expect(el).not.toHaveClass("scrolled");
    await act(async () => {
      Object.defineProperty(window, "scrollY", { value: 200, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(el).toHaveClass("scrolled");
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });
});

describe("SiteHeader scrollspy", () => {
  it("highlights the section that is on screen", async () => {
    withObserver();
    for (const id of ["how", "features", "security", "pricing", "faq"]) {
      const el = document.createElement("section");
      el.id = id;
      document.body.appendChild(el);
    }
    render(<SiteHeader theme="light" onToggleTheme={() => undefined} installUrl={null} />);
    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(within(nav).getByRole("link", { name: "Pricing" })).not.toHaveAttribute("aria-current");
    await act(async () => {
      observers.forEach((o) => o.emit([{ target: document.getElementById("pricing")!, isIntersecting: true, intersectionRatio: 0.6 }]));
    });
    expect(within(nav).getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "location");
    expect(within(nav).getByRole("link", { name: "FAQ" })).not.toHaveAttribute("aria-current");
    await act(async () => {
      observers.forEach((o) => o.emit([{ target: document.getElementById("pricing")!, isIntersecting: false, intersectionRatio: 0 }]));
    });
    expect(within(nav).getByRole("link", { name: "Pricing" })).not.toHaveAttribute("aria-current");
    for (const id of ["how", "features", "security", "pricing", "faq"]) document.getElementById(id)?.remove();
  });

  it("does not spy on sections when the visitor is not on the home page", () => {
    withObserver();
    window.history.replaceState(null, "", "/privacy");
    render(<SiteHeader theme="light" onToggleTheme={() => undefined} installUrl={null} />);
    expect(observers).toHaveLength(0);
  });
});

describe("the animated example review", () => {
  it("shows the finished review straight away when motion is off", () => {
    pref.reduce = true;
    wrap(<ReviewPreview />);
    expect(screen.getByText(/divides by zero/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Suggested fix")).toBeInTheDocument();
    expect(screen.getByText(/accepted by the author/i)).toBeInTheDocument();
  });

  it("is still labeled as an example", () => {
    pref.reduce = true;
    wrap(<ReviewPreview />);
    expect(screen.getByText("Example")).toBeInTheDocument();
  });

  it.each([
    [0, false, false, false],
    [1, false, false, false],
    [3, false, false, false],
    [4, true, false, false],
    [5, true, true, false],
    [6, true, true, true],
  ])("step %i: comment=%s fix=%s accepted=%s", (step, comment, fix, accepted) => {
    render(<ReviewFrame step={step} />);
    expect(!!screen.queryByText(/divides by zero/i)).toBe(comment);
    expect(!!screen.queryByLabelText("Suggested fix")).toBe(fix);
    expect(!!screen.queryByText(/accepted by the author/i)).toBe(accepted);
  });

  it("adds the changed lines one at a time, then a 'reading' state before the comment", () => {
    const { rerender } = render(<ReviewFrame step={0} />);
    expect(screen.queryByText(/return total \* \(1/)).toBeNull();
    rerender(<ReviewFrame step={1} />);
    expect(screen.getByText(/return total \* \(1/)).toBeInTheDocument();
    expect(screen.queryByText(/return total \/ pct/)).toBeNull();
    rerender(<ReviewFrame step={3} />);
    expect(screen.getByRole("status")).toHaveTextContent(/reading the change/i);
  });

  it("plays through the review while on screen and then starts over", async () => {
    vi.useFakeTimers();
    withObserver();
    wrap(<ReviewPreview />);
    await act(async () => {
      observers.forEach((o) => o.emit([{ isIntersecting: true }]));
    });
    expect(screen.queryByText(/divides by zero/i)).toBeNull();
    // Each step schedules the next one only after React has re-rendered, so advance one step at a time.
    const play = async (from: number, to: number) => {
      for (let i = from; i < to; i++) {
        await act(async () => {
          vi.advanceTimersByTime(STEP_MS[i]);
        });
      }
    };
    await play(0, 4);
    expect(screen.getByText(/divides by zero/i)).toBeInTheDocument();
    await play(4, STEP_MS.length); // the rest of the review, then the hold, then it starts over
    expect(screen.queryByText(/divides by zero/i)).toBeNull(); // back to the start
  });

  it("stops playing when scrolled out of view", async () => {
    vi.useFakeTimers();
    withObserver();
    wrap(<ReviewPreview />);
    await act(async () => {
      observers.forEach((o) => o.emit([{ isIntersecting: false }]));
    });
    await act(async () => {
      vi.advanceTimersByTime(20_000);
    });
    expect(screen.queryByText(/divides by zero/i)).toBeNull(); // nothing advanced while hidden
  });
});

describe("proof strip", () => {
  it("shows the measured figures with their caveats and sources", () => {
    pref.reduce = true;
    render(<ProofStrip />);
    const strip = screen.getByRole("region", { name: "Measured results" });
    expect(strip).toHaveTextContent(/84%.*86%/);
    expect(strip).toHaveTextContent(/95%.*98%/);
    expect(within(strip).getByText(/58 labeled changes \(small, and recall is probably optimistic\)/)).toBeInTheDocument();
    for (const link of within(strip).getAllByRole("link")) expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("features", () => {
  it("shows the six features, and the config example without its comment lines", () => {
    pref.reduce = true;
    render(<Features />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6);
    const yaml = document.querySelector(".mini-code.yaml")!;
    expect(yaml).toHaveTextContent("strictness: high");
    expect(yaml.textContent).not.toContain("#"); // no comments, inline or otherwise
  });

  it("hides decorative mini-visuals from assistive technology", () => {
    pref.reduce = true;
    const { container } = render(<Features />);
    for (const mini of container.querySelectorAll(".mini")) expect(mini).toHaveAttribute("aria-hidden", "true");
  });
});

describe("configPreview", () => {
  it("drops comment lines, trailing comments and blank lines", () => {
    const out = configPreview("# title\n\nignore:  # globs\n  - \"a\"\nstrictness: high # how sure\n");
    expect(out).toBe('ignore:\n  - "a"\nstrictness: high');
  });
});
