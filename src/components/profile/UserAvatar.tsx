"use client";

import Link from "next/link";

interface Props {
  /** Two-letter uppercase initials derived server-side from the JWT cookie. */
  initials: string | null;
}

/**
 * Renders the user avatar pill in the header.
 *
 * - Logged in  → initials circle that links to /profile
 * - Logged out → "Log in" link + "Sign up" button
 *
 * The `initials` prop MUST be computed server-side (the "jwt" cookie is
 * HttpOnly and invisible to client JS). Never read document.cookie here.
 */
export default function UserAvatar({ initials }: Props) {
  if (initials) {
    return (
      <Link
        href="/profile"
        aria-label="Go to your profile"
        className="flex items-center justify-center w-9 h-9 rounded-full
                   bg-[#3B1892]/10 text-[#3B1892] font-medium text-sm
                   hover:bg-[#3B1892]/15 transition-colors duration-150 select-none"
      >
        {initials}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150"
      >
        Log in
      </Link>
      <Link
        href="/register"
        className="bg-[#3B1892] text-white rounded-xl px-4 py-2 text-sm font-semibold
                   hover:bg-[#2f1275] transition-colors duration-150"
      >
        Sign up
      </Link>
    </div>
  );
}