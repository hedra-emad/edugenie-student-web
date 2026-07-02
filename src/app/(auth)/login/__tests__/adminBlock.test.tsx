/**
 * @vitest-environment jsdom
 *
 * End-to-end (component → onSubmit → auth API) test of the "admins can't sign
 * in on the student app" block.
 *
 * Drives the REAL login page: types a valid email/password into the rendered
 * form and clicks "Sign In", with only the auth API module + router mocked.
 * Asserts the role-branching in onSubmit:
 *   - admin / superadmin  → session revoked (logout), error shown, NO handoff
 *   - instructor          → handed off to the dashboard (handoffCode)
 *   - student             → verified + routed to "/"
 */
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
// Use the vitest entrypoint so jest-dom extends vitest's `expect` (this project
// has no vitest config enabling `globals`, so the plain import can't find one).
import "@testing-library/jest-dom/vitest";

// ── Auth API: the module under test's decision inputs/outputs ────────────────
const login = vi.fn();
const verifyExchangeToken = vi.fn(() => Promise.resolve({}));
const handoffCode = vi.fn(() => Promise.resolve({ code: "HANDOFF123" }));
const logout = vi.fn(() => Promise.resolve({}));

vi.mock("@/lib/api/auth", () => ({
  login: (...a: unknown[]) => login(...a),
  verifyExchangeToken: (...a: unknown[]) => verifyExchangeToken(...a),
  handoffCode: (...a: unknown[]) => handoffCode(...a),
  logout: (...a: unknown[]) => logout(...a),
}));
vi.mock("@/lib/api/auth/googleAuth", () => ({ redirectToGoogleAuth: vi.fn() }));

// ── Router + react-query ─────────────────────────────────────────────────────
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// ── UI children mocked to their essential interactive surface ────────────────
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
type InputProps = {
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};
vi.mock("@/components/auth/AuthInput", () => ({
  default: (p: InputProps) => (
    <input aria-label={p.label} value={p.value} onChange={p.onChange} />
  ),
}));
vi.mock("@/components/auth/PasswordInput", () => ({
  default: (p: InputProps) => (
    <input aria-label={p.label} type="password" value={p.value} onChange={p.onChange} />
  ),
}));
vi.mock("@/components/auth/AuthButton", () => ({
  default: (p: {
    type?: "button" | "submit";
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <button type={p.type} disabled={p.disabled}>
      {p.children}
    </button>
  ),
}));
vi.mock("@/components/auth/AuthLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/auth/AuthCard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/auth/AuthLogo", () => ({ default: () => null }));
vi.mock("@/components/auth/AuthTabs", () => ({ default: () => null }));
vi.mock("@/components/auth/AuthDivider", () => ({ default: () => null }));
vi.mock("@/components/auth/SocialLogin", () => ({ default: () => null }));
vi.mock("@/components/auth/RememberMe", () => ({ default: () => null }));

import LoginPage from "../page";

// Stub window.location so the instructor path's `window.location.href = ...`
// records instead of triggering a jsdom "navigation not implemented" error.
const realLocation = window.location;
Object.defineProperty(window, "location", {
  configurable: true,
  value: { href: "" },
});
afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: realLocation,
  });
});

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText("Email Address"), {
    target: { value: "user@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Password123!" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

const ADMIN_ERROR = /administrator accounts can't sign in here/i;

describe("Login page — admins/superadmins are blocked on the student app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.location as { href: string }).href = "";
  });

  // This repo ships no vitest config, so RTL's automatic per-test cleanup isn't
  // registered — unmount between tests so rendered forms don't accumulate.
  afterEach(() => cleanup());

  it.each(["admin", "superadmin"])(
    "%s → revokes the session, shows an error, and does NOT hand off",
    async (role) => {
      login.mockResolvedValueOnce({ data: { user: { role } } });
      render(<LoginPage />);
      fillAndSubmit();

      // The block message renders...
      expect(await screen.findByText(ADMIN_ERROR)).toBeInTheDocument();
      // ...the just-minted session is revoked...
      expect(logout).toHaveBeenCalledTimes(1);
      // ...and the user is NOT let through to the dashboard or the app.
      expect(handoffCode).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    },
  );

  it("instructor → is handed off to the dashboard (not blocked)", async () => {
    login.mockResolvedValueOnce({ data: { user: { role: "instructor" } } });
    render(<LoginPage />);
    fillAndSubmit();

    await waitFor(() => expect(handoffCode).toHaveBeenCalledTimes(1));
    expect(logout).not.toHaveBeenCalled();
    expect(screen.queryByText(ADMIN_ERROR)).not.toBeInTheDocument();
    await waitFor(() =>
      expect((window.location as { href: string }).href).toContain(
        "/auth/redeem?code=HANDOFF123",
      ),
    );
  });

  it("student → is verified and routed into the app (not blocked)", async () => {
    login.mockResolvedValueOnce({
      data: { user: { role: "student" }, exchangeToken: "EX123" },
    });
    render(<LoginPage />);
    fillAndSubmit();

    await waitFor(() =>
      expect(verifyExchangeToken).toHaveBeenCalledWith({ token: "EX123" }),
    );
    expect(push).toHaveBeenCalledWith("/");
    expect(logout).not.toHaveBeenCalled();
    expect(handoffCode).not.toHaveBeenCalled();
  });
});
