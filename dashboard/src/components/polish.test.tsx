import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./EmptyState";
import { Tile } from "./Tile";
import { ToastProvider, useToast } from "./Toast";

function Button({ text, kind }: { text: string; kind?: "ok" | "error" }) {
  const toast = useToast();
  return <button onClick={() => toast(text, kind)}>go {text}</button>;
}

afterEach(() => vi.useRealTimers());

describe("Toast", () => {
  it("shows a confirmation, politely announced, and removes it by itself", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { container } = render(
      <ToastProvider>
        <Button text="Saved" />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(container.querySelector(".toasts")).toHaveAttribute("aria-live", "polite");
    await act(async () => {
      vi.advanceTimersByTime(3300);
    });
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("styles errors differently and never stacks more than three", async () => {
    const { container } = render(
      <ToastProvider>
        <Button text="one" />
        <Button text="two" />
        <Button text="three" />
        <Button text="four" kind="error" />
      </ToastProvider>,
    );
    for (const b of screen.getAllByRole("button")) await userEvent.click(b);
    expect(container.querySelectorAll(".toast")).toHaveLength(3);
    expect(screen.queryByText("one")).not.toBeInTheDocument(); // the oldest made room
    expect(screen.getByText("four").closest(".toast")).toHaveClass("error");
  });

  it("does nothing, harmlessly, outside a provider", async () => {
    render(<Button text="x" />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("x")).not.toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("says what is missing and what to do, with a decorative drawing", () => {
    const { container } = render(<EmptyState title="No reviews yet." hint="Open a pull request." />);
    expect(screen.getByText("No reviews yet.")).toBeInTheDocument();
    expect(screen.getByText("Open a pull request.")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("works without a hint", () => {
    render(<EmptyState title="Nothing." />);
    expect(screen.getByText("Nothing.")).toBeInTheDocument();
  });
});

describe("Tile", () => {
  it("shows its value, or a counting number when asked", () => {
    const { rerender } = render(<Tile icon="cpu" label="Tokens" value="45K" />);
    expect(screen.getByText("45K")).toBeInTheDocument();
    rerender(<Tile icon="cpu" label="Tokens" value="45K" count={{ value: 45200, format: (n) => `${Math.round(n / 1000)}K` }} />);
    expect(screen.getByText("45K")).toBeInTheDocument(); // motion off in tests: the final number at once
  });
});

import { ScrollBox } from "./ScrollBox";

describe("ScrollBox", () => {
  it("is a named, keyboard-focusable region around a sideways-scrolling table", () => {
    render(
      <ScrollBox label="Repositories table">
        <table><tbody><tr><td>x</td></tr></tbody></table>
      </ScrollBox>,
    );
    const region = screen.getByRole("region", { name: "Repositories table" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region.querySelector("table")).not.toBeNull();
  });
});

import { CodeBlock } from "./docs/CodeBlock";

describe("CodeBlock accessibility", () => {
  it("is a focusable named region so long lines can be scrolled with the keyboard", () => {
    render(<CodeBlock code="a: 1" label="sample" />);
    const region = screen.getByRole("region", { name: "sample" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveTextContent("a: 1");
  });
});
