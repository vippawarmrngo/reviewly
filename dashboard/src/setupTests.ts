import "@testing-library/jest-dom/vitest";

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
