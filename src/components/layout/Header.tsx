"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCartContext } from "@/contexts/CartContext";

interface User {
  name: string;
  image?: string;
}

interface HeaderProps {
  user?: User | null; // null = logged out
}

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
      {/* Shopping cart SVG */}
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
      {/* Badge */}
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

export default function Header({ user = null }: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCartContext();

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-6 py-3">

        {/* ── Left: Logo ── */}
        <Link href="/" className="text-xl font-bold text-[#3B1892] tracking-tight shrink-0">
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

        {/* ── Right: Cart Icon (desktop) + Search + Auth ── */}
        <div className="flex items-center gap-3">

          {/* Cart icon — desktop (hidden on mobile; mobile version lives in the hamburger panel) */}
          <div className="hidden md:flex">
            <CartIcon count={cartCount} />
          </div>

          {/* Search */}
          {/* <div className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <svg
              className="h-4 w-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search courses…"
              className="w-40 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div> */}

          {/* Logged OUT → Login + Sign Up */}
          {!user && (
            <div className="flex items-center gap-2">
              <Link
                href="https://edugenie-dashboard.vercel.app/login"
                className="text-sm font-medium text-gray-700 hover:text-indigo-700 transition-colors duration-150 px-3 py-1.5"
              >
                Login
              </Link>
              <Link
                href="https://edugenie-dashboard.vercel.app/register"
                className="rounded-lg bg-[#3B1892] px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors duration-150"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Logged IN → Avatar + Logout */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex items-center gap-2">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 ring-2 ring-indigo-200">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={() => {
                 
                  console.log("logout");
                }}
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
          {/* Mobile Search */}
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

          {/* Cart icon — mobile */}
          <div className="flex items-center gap-3 py-1">
            <CartIcon count={cartCount} />
            <span className="text-sm font-medium text-gray-700">Cart</span>
          </div>

          {!user && (
            <div className="flex gap-2 pt-1">
              <Link href="/login" className="flex-1 text-center rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:border-indigo-400 transition-colors">
                Login
              </Link>
              <Link href="/signup" className="flex-1 text-center rounded-lg bg-[#3B1892] py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}