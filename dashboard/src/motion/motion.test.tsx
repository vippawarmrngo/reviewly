import { act, render, screen } from "@testing-library/react";
import { CountUp } from "./CountUp";
import { MotionProvider } from "./MotionProvider";
import { PageTransition } from "./PageTransition";
import { Reveal } from "./Reveal";

// framer-motion reads the OS preference once and caches it, so tests set it through this switch instead.
const pref = vi.hoisted(() => ({ reduce: false }));
vi.mock("framer-motion", async (orig) => ({
  ...(await orig<typeof import("framer-motion")>()),
  useReducedMotion: () => pref.reduce,
  // jsdom has no animation frames worth waiting for: finish instantly, so the test checks our wiring, not framer.
  animate: (_from: number, to: number, opts: { onUpdate: (v: number) => void }) => {
    opts.onUpdate(to);
    return { stop() {} };
  },
}));

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
  show() {
    this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

function withObserver() {
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
}
function reduceMotion(on: boolean) {
  pref.reduce = on;
}
const wrap = (ui: React.ReactNode) => render(<MotionProvider>{ui}</MotionProvider>);

afterEach(() => vi.unstubAllGlobals());

describe("Reveal", () => {
  it("shows its content untouched when the browser cannot observe scrolling", () => {
    reduceMotion(false);
    const { container } = wrap(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello")).toBeVisible();
    expect(container.querySelector("[style]")).toBeNull(); // no hidden starting state to get stuck in
  });

  it("shows its content untouched when the user asked for reduced motion", () => {
    withObserver();
    reduceMotion(true);
    const { container } = wrap(<Reveal>hello</Reveal>);
    expect(container.querySelector("[style]")).toBeNull();
  });

  it("starts hidden and waits to be scrolled into view when motion is on", () => {
    withObserver();
    reduceMotion(false);
    const { container } = wrap(<Reveal>hello</Reveal>);
    expect((container.querySelector("[style]") as HTMLElement).style.opacity).toBe("0");
    expect(screen.getByText("hello")).toBeInTheDocument(); // hidden visually, still in the document for screen readers
  });

  it("keeps the element type and class", () => {
    reduceMotion(false);
    const { container } = wrap(
      <ul>
        <Reveal as="li" className="row">
          item
        </Reveal>
      </ul>,
    );
    expect(container.querySelector("li.row")).not.toBeNull();
  });
});

describe("CountUp", () => {
  it("shows the final number immediately when motion is off", () => {
    reduceMotion(true);
    withObserver();
    wrap(<CountUp value={84} format={(n) => `${Math.round(n)}%`} />);
    expect(screen.getAllByText("84%").length).toBeGreaterThan(0);
  });

  it("starts from zero visually but always tells screen readers the real value", () => {
    reduceMotion(false);
    withObserver();
    const { container } = wrap(<CountUp value={84} format={(n) => `${Math.round(n)}%`} />);
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("0%");
    expect(container.querySelector(".sr-only")).toHaveTextContent("84%");
  });

  it("survives a browser with no IntersectionObserver at all", () => {
    reduceMotion(false); // motion "on", but nothing can report visibility
    wrap(<CountUp value={5} />);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
  });

  it("starts counting once it scrolls into view", async () => {
    reduceMotion(false);
    withObserver();
    const { container } = wrap(<CountUp value={84} duration={0.01} format={(n) => `${Math.round(n)}%`} />);
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("0%");
    await act(async () => {
      observers.forEach((o) => o.show());
    });
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("84%");
  });

  it("formats with the supplied function", () => {
    reduceMotion(true);
    wrap(<CountUp value={1234.5} format={(n) => n.toFixed(1)} />);
    expect(screen.getAllByText("1234.5").length).toBeGreaterThan(0);
  });
});

describe("PageTransition", () => {
  it("is invisible plumbing when motion is off", () => {
    reduceMotion(true);
    const { container } = wrap(<PageTransition pageKey="a">page</PageTransition>);
    expect(container.querySelector("[style]")).toBeNull();
    expect(screen.getByText("page")).toBeVisible();
  });

  it("fades the new page in when motion is on", () => {
    withObserver();
    reduceMotion(false);
    const { container } = wrap(<PageTransition pageKey="a">page</PageTransition>);
    expect(container.querySelector("[style]")).not.toBeNull();
    expect(screen.getByText("page")).toBeInTheDocument();
  });
});
