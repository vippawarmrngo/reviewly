import { render, screen } from "@testing-library/react";
import { Login } from "./Login";

const cfg = (over: Partial<{ github_login: boolean }> = {}) => ({
  app_install_url: null, github_login: true, ...over,
});

describe("Login", () => {
  it("offers GitHub sign-in when the server has it configured", () => {
    render(<Login config={cfg()} />);
    expect(screen.getByRole("link", { name: /sign in with github/i })).toHaveAttribute("href", "/auth/github/login");
    expect(screen.queryByText(/not set up/i)).not.toBeInTheDocument();
  });

  it("does not offer a button that cannot work when GitHub sign-in is not configured", () => {
    render(<Login config={cfg({ github_login: false })} />);
    expect(screen.queryByRole("link", { name: /sign in with github/i })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/GitHub sign-in is not set up on this server/i);
  });

  it("still offers GitHub sign-in while the config is unknown (it could not be loaded)", () => {
    render(<Login config={null} />);
    expect(screen.getByRole("link", { name: /sign in with github/i })).toBeInTheDocument();
  });

  it("offers no way to sign in other than GitHub", () => {
    render(<Login config={cfg()} />);
    expect(screen.queryByRole("button", { name: /developer/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});

describe("Login page", () => {
  it("is a compact sign-in card that points new visitors back to the home page", () => {
    render(<Login config={cfg()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sign in to Reviewly");
    expect(screen.getByText(/install the GitHub App from the home page/i)).toBeInTheDocument();
  });
});
