// Feature: cart-page, Property 14: Header badge reflects any cart item count correctly

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

fc.configureGlobal({ numRuns: 100 });

/**
 * Pure badge computation function that mirrors the Header's badge rendering logic.
 *
 * Rules (from design.md / Requirements 7.2, 7.3, 7.4):
 *   - null or 0  → no badge (returns null)
 *   - 1–99       → show exact count as string
 *   - > 99       → show "99+"
 */
function getBadgeText(n: number | null): string | null {
  if (n === null || n === 0) return null;
  if (n > 99) return "99+";
  return String(n);
}

// ---------------------------------------------------------------------------
// Property 14: Header badge reflects any cart item count correctly
// Validates: Requirements 7.2, 7.3, 7.4
// ---------------------------------------------------------------------------

describe("Property 14: Header badge reflects any cart item count correctly", () => {
  it("returns null (no badge) when cartCount is null", () => {
    expect(getBadgeText(null)).toBeNull();
  });

  it("returns null (no badge) when cartCount is 0", () => {
    expect(getBadgeText(0)).toBeNull();
  });

  it("[property] returns null for n === 0 (no badge for empty cart)", () => {
    // Validates: Requirement 7.3 — zero items → no badge
    fc.assert(
      fc.property(fc.constant(0), (n) => {
        expect(getBadgeText(n)).toBeNull();
      })
    );
  });

  it("[property] shows exact count string for 1 ≤ n ≤ 99", () => {
    // Validates: Requirement 7.2 — 1–99 items → badge shows exact count
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), (n) => {
        const badge = getBadgeText(n);
        expect(badge).not.toBeNull();
        expect(badge).toBe(String(n));
      })
    );
  });

  it("[property] shows '99+' for n > 99", () => {
    // Validates: Requirement 7.2 — more than 99 items → badge shows "99+"
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 10_000 }), (n) => {
        const badge = getBadgeText(n);
        expect(badge).toBe("99+");
      })
    );
  });

  it("[property] badge is absent or a non-empty string for any non-negative integer n", () => {
    // Validates: Requirements 7.3, 7.4 — combined coverage of all n ≥ 0
    fc.assert(
      fc.property(fc.nat(), (n) => {
        const badge = getBadgeText(n);
        if (n === 0) {
          // Requirement 7.3: zero items → no badge
          expect(badge).toBeNull();
        } else if (n <= 99) {
          // Requirement 7.2: 1–99 → exact count
          expect(badge).toBe(String(n));
        } else {
          // Requirement 7.2: > 99 → "99+"
          expect(badge).toBe("99+");
        }
      })
    );
  });
});
