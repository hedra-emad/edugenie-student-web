"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, logout } from "@/lib/api/auth";
import { useRouter } from "next/navigation";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/about" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    retry: false,
  });

  const user = profileResponse?.data;

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

        {/* ── Right: Search + Auth ── */}
        <div className="flex items-center gap-3">

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

          {/* Logged IN → Avatar + Logout */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.firstName || "User"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 ring-2 ring-indigo-200">
                    {(user.firstName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={async () => {
                  try {
                    await logout();
                    queryClient.setQueryData(["profile"], null);
                    queryClient.removeQueries({ queryKey: ["profile"] });
                    router.push("/login");
                  } catch (e) {
                    console.error("Logout failed", e);
                  }
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

          {!user ? (
            <div className="flex gap-2 pt-1">
              <Link href="/login" className="flex-1 text-center rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:border-indigo-400 transition-colors">
                Login
              </Link>
              <Link href="/register" className="flex-1 text-center rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors">
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <button 
                onClick={async () => {
                  try {
                    await logout();
                    queryClient.setQueryData(["profile"], null);
                    queryClient.removeQueries({ queryKey: ["profile"] });
                    router.push("/login");
                  } catch (e) {
                    console.error("Logout failed", e);
                  }
                }} 
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