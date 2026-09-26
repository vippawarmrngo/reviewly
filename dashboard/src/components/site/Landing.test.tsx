import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Landing } from "./Landing";
import { Privacy } from "./Privacy";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import type { PublicConfig } from "../../types";

const INSTALL = "https://github.com/apps/reviewly/installations/new";
const cfg = (over: Partial<PublicConfig> = {}): PublicConfig => ({
  app_install_url: INSTALL, github_login: true, dev_login: false, free_reviews_per_month: 20, billing: false, ...over,
});

describe("Landing", () => {
  it("states the value in the headline and shows a real example review", () => {
    render(<Landing config={cfg()} installUrl={INSTALL} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/catch bugs in pull requests/i);
    const example = screen.getByRole("figure", { name: "Example review comment" });
    expect(within(example).getByText("Example")).toBeInTheDocument(); // never passed off as a real review
    expect(within(example).getByText(/divides by zero/i)).toBeInTheDocument();
  });

  it("sends people to install the App when the install URL is known", () => {
    render(<Landing config={cfg()} installUrl={INSTALL} />);
    for (const link of screen.getAllByRole("link", { name: /install on github/i })) expect(link).toHaveAttribute("href", INSTALL);
  });

  it("falls back to sign in when there is no install URL", () => {
    render(<Landing config={cfg({ app_install_url: null })} installUrl={null} />);
    expect(screen.queryByRole("link", { name: /install on github/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toHaveAttribute("href", "#/signin");
  });

  it("has every section the header links to", () => {
    const { container } = render(<Landing config={cfg()} installUrl={INSTALL} />);
    for (const id of ["how", "features", "security", "pricing", "faq"]) expect(container.querySelector(`#${id}`)).not.toBeNull();
  });

  it("shows the real free allowance from the server, not a hardcoded number", () => {
    const { rerender } = render(<Landing config={cfg({ free_reviews_per_month: 7 })} installUrl={INSTALL} />);
    expect(screen.getByText("7 reviews / month")).toBeInTheDocument();
    rerender(<Landing config={cfg({ free_reviews_per_month: 0 })} installUrl={INSTALL} />);
    expect(screen.getByText("Unlimited")).toBeInTheDocument();
    rerender(<Landing config={null} installUrl={null} />);
    expect(screen.getByText("Monthly allowance")).toBeInTheDocument(); // config unknown: no invented number
  });

  it("only offers an upgrade when billing is really enabled", () => {
    const { rerender } = render(<Landing config={cfg({ billing: false })} installUrl={INSTALL} />);
    expect(screen.getByText(/paid plans are not enabled/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in to upgrade/i })).not.toBeInTheDocument();
    rerender(<Landing config={cfg({ billing: true })} installUrl={INSTALL} />);
    expect(screen.getByRole("link", { name: /sign in to upgrade/i })).toBeInTheDocument();
  });

  it("answers the questions people have before installing, and is honest about accuracy", async () => {
    render(<Landing config={cfg()} installUrl={INSTALL} />);
    const faq = screen.getByRole("heading", { name: "Questions" }).closest("section")!;
    expect(within(faq).getAllByText(/\?$/).length).toBeGreaterThanOrEqual(6);
    expect(within(faq).getByText(/never approves, never requests changes/i)).toBeInTheDocument();
    const accuracy = within(faq).getByText(/small internal benchmark/i);
    expect(accuracy).toHaveTextContent(/probably optimistic/i);
    expect(accuracy).toHaveTextContent(/not a promise/i);
  });

  it("makes no claim it cannot back: no customer logos, no compliance badges, no uptime numbers", () => {
    const { container } = render(<Landing config={cfg()} installUrl={INSTALL} />);
    expect(container.textContent).not.toMatch(/SOC ?2|ISO ?27001|GDPR|99\.\d+%|trusted by|customers/i);
  });
});

describe("SiteHeader and footer", () => {
  it("links to sign in and toggles the theme", async () => {
    const toggle = vi.fn();
    render(<SiteHeader theme="light" onToggleTheme={toggle} installUrl={INSTALL} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "#/signin");
    await userEvent.click(screen.getByRole("button", { name: /switch to dark mode/i }));
    expect(toggle).toHaveBeenCalled();
  });

  it("scrolls to a section from the header", async () => {
    const scroll = vi.fn();
    const el = document.createElement("div");
    el.id = "pricing";
    el.scrollIntoView = scroll;
    document.body.appendChild(el);
    window.location.hash = "#/";
    render(<SiteHeader theme="light" onToggleTheme={() => undefined} installUrl={null} />);
    await userEvent.click(screen.getByRole("link", { name: "Pricing" }));
    expect(scroll).toHaveBeenCalled();
    el.remove();
  });

  it("footer links to data handling and the source, and shows the license", () => {
    render(<SiteFooter installUrl={INSTALL} />);
    expect(screen.getByRole("link", { name: "Data handling" })).toHaveAttribute("href", "#/privacy");
    expect(screen.getByRole("link", { name: /source code/i })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/MIT license/)).toBeInTheDocument();
  });
});

describe("Privacy", () => {
  it("describes behaviour and says it is not a legal policy", () => {
    render(<Privacy />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Data handling");
    expect(screen.getByText(/not a legal policy/i)).toBeInTheDocument();
    expect(screen.getByText(/do not store the diff itself/i)).toBeInTheDocument();
    expect(screen.getByText(/masking is pattern-based and can miss/i)).toBeInTheDocument();
  });
});
