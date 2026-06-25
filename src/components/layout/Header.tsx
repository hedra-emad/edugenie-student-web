"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { useCartContext } from "@/contexts/CartContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/about" },
];

/** Renders the cart icon + badge for the given count. */
function CartIcon({ count }: { count: number | null }) {
  const hasBadge = count !== null && count >= 1;
  const badgeText = count !== null && count > 99 ? "99+" : String(count ?? 0);
  const ariaLabel =
    hasBadge
      ? count! > 99
        ? "Cart, 99+ items"
        : `Cart, ${count} item${count === 1 ? "" : "s"}`
      : "Cart";

  return (
    <Link
      href="/cart"
      aria-label={ariaLabel}
      className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-600 hover:text-indigo-700 hover:bg-gray-100 transition-colors duration-150"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        />
      </svg>
      {hasBadge && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
        >
          {badgeText}
        </span>
      )}
    </Link>
  );
}

interface HeaderProps {
  /** True when the jwt cookie exists and role === "student". */
  isStudent: boolean;
  /** Decoded name or email from the JWT payload, or null for guests. */
  displayName: string | null;
}

export default function Header({ isStudent, displayName }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { cartCount } = useCartContext();

  async function handleLogout() {
    try {
      await logout();
      router.push("/login");
      router.refresh(); // rerun Server Components so HeaderServer re-reads cookie
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-6 py-3">

        {/* ── Left: Logo ── */}
        <Link href="/" className="text-xl font-bold text-primary tracking-tight shrink-0">
          EduGenie
        </Link>

        {/* ── Center: Nav Links ── */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-indigo-700 transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── Right: Auth + Cart ── */}
        <div className="flex items-center gap-3">

          {/* Cart icon — desktop, students only */}
          {isStudent && (
            <div className="hidden md:flex">
              <CartIcon count={cartCount} />
            </div>
          )}

          {/* Guest / non-student → Login + Sign Up */}
          {!isStudent && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-indigo-700 transition-colors duration-150 px-3 py-1.5"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-light transition-colors duration-150"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Student → Name + Logout */}
          {isStudent && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {/* Avatar initial */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 ring-2 ring-indigo-200">
                  {(displayName ?? "U").charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {displayName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors duration-150 px-2 py-1"
              >
                Logout
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search courses…"
              className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-indigo-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Cart icon — mobile, students only */}
          {isStudent && (
            <div className="flex items-center gap-3 py-1">
              <CartIcon count={cartCount} />
              <span className="text-sm font-medium text-gray-700">Cart</span>
            </div>
          )}

          {/* Guest / non-student → Login + Sign Up */}
          {!isStudent && (
            <div className="flex gap-2 pt-1">
              <Link href="/login" className="flex-1 text-center rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:border-indigo-400 transition-colors">
                Login
              </Link>
              <Link href="/register" className="flex-1 text-center rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors">
                Sign Up
              </Link>
            </div>
          )}

          {/* Student → name + logout */}
          {isStudent && (
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-sm font-medium text-gray-700">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                className="flex-1 text-center rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
