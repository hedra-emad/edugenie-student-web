"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { logout } from "@/lib/api/auth";
import { getCart } from "@/lib/api/checkout";
import { useRouter } from "next/navigation";
import { useSession } from "@/providers/SessionProvider";
import { useCartContext } from "@/contexts/CartContext";
import Button, { buttonClasses } from "@/components/ui/Button";
import CoachWidget from "@/components/coach/CoachWidget";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/about" },
];

function CartIcon({ count }: { count: number | null }) {
  const hasBadge = count !== null && count >= 1;
  const badgeText = count !== null && count > 99 ? "99+" : String(count ?? 0);
  const ariaLabel = hasBadge
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

/** Round profile picture with an initials fallback. */
function Avatar({
  displayName,
  avatarUrl,
  className = "h-8 w-8",
}: {
  displayName: string | null;
  avatarUrl: string | null;
  className?: string;
}) {
  const initial = (displayName ?? "U").charAt(0).toUpperCase();
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName ?? "Profile"}
        className={`${className} rounded-full object-cover ring-2 ring-indigo-200`}
      />
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 ring-2 ring-indigo-200`}
    >
      {initial}
    </div>
  );
}

/** Avatar + name — links to /profile */
function UserAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string | null;
  avatarUrl: string | null;
}) {
  return (
    <Link
      href="/profile"
      aria-label="Go to profile"
      className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-gray-100 transition-colors duration-150"
    >
      <Avatar displayName={displayName} avatarUrl={avatarUrl} />
      <span className="hidden sm:block text-sm font-medium text-gray-700">
        {displayName ?? "My account"}
      </span>
    </Link>
  );
}

interface HeaderProps {
  isStudent: boolean;
  displayName: string | null;
  avatarUrl?: string | null;
  /** Server-rendered cart count — seeds the badge so it's right on first paint. */
  initialCartCount?: number | null;
}

export default function Header({
  isStudent,
  displayName,
  avatarUrl = null,
  initialCartCount = null,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useSession();
  // Shared, realtime cart count. Add (CourseCard) and remove (cart page) write
  // here synchronously, so the badge updates instantly across pages.
  const { cartCount, setCartCount } = useCartContext();

  // Seed the shared count from the server-rendered value so the badge is correct
  // on the first paint of every page (not just the cart page).
  useEffect(() => {
    if (initialCartCount != null) setCartCount(initialCartCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCartCount]);

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
    enabled: isStudent && isAuthenticated,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (cartData) setCartCount(cartData.items.length);
  }, [cartData, setCartCount]);

  const count = cartCount ?? initialCartCount;
  const badgeCount = count && count > 0 ? count : null;

  async function handleLogout() {
    try {
      await logout();
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-6 py-3">

        {/* ── Logo ── */}
        <Link href="/" className="text-xl font-bold text-primary tracking-tight shrink-0">
          EduGenie
        </Link>

        {/* ── Nav ── */}
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
          {/* AI roadmap advisor — students only */}
          {isStudent && (
            <Link
              href="/roadmap"
              className="group flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors duration-150"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
              </svg>
              Roadmap
            </Link>
          )}
          {/* AI Learning Coach — students only */}
          {isStudent && (
            <Link
              href="/coach"
              className="group flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors duration-150"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
              </svg>
              Coach
            </Link>
          )}
        </nav>

        {/* ── Right ── */}
        <div className="flex items-center gap-3">

          {/* Coach — students only */}
          {isStudent && isAuthenticated && <CoachWidget />}

          {/* Cart — students only */}
          {isStudent && (
            <div className="hidden md:flex">
              <CartIcon count={badgeCount} />
            </div>
          )}

          {/* Guest → Login + Sign Up */}
          {!isStudent && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={buttonClasses({ variant: "primary", size: "sm" })}
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Student → Avatar (links to /profile) + Logout */}
          {isStudent && (
            <div className="flex items-center gap-3">
              <UserAvatar displayName={displayName} avatarUrl={avatarUrl} />
              <Button variant="destructiveOutline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden"
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
          </Button>
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
          {/* AI roadmap advisor — students only */}
          {isStudent && (
            <Link
              href="/roadmap"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
              </svg>
              Roadmap
            </Link>
          )}
          {/* AI Learning Coach — students only */}
          {isStudent && (
            <Link
              href="/coach"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
              </svg>
              Coach
            </Link>
          )}

          {/* Cart — mobile, students only */}
          {isStudent && (
            <div className="flex items-center gap-3 py-1">
              <CartIcon count={badgeCount} />
              <span className="text-sm font-medium text-gray-700">Cart</span>
            </div>
          )}

          {/* Guest → Login + Sign Up */}
          {!isStudent && (
            <div className="flex gap-2 pt-1">
              <Link href="/login" className={buttonClasses({ variant: "outline", className: "flex-1" })}>
                Login
              </Link>
              <Link href="/register" className={buttonClasses({ variant: "primary", className: "flex-1" })}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Student → Avatar link + Logout */}
          {isStudent && (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <Avatar displayName={displayName} avatarUrl={avatarUrl} />
                <span className="text-sm font-medium text-gray-700">{displayName ?? "My account"}</span>
              </Link>
              <Button
                variant="destructiveOutline"
                onClick={handleLogout}
                className="flex-1"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}