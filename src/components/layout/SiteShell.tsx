"use client";
// components/layout/SiteShell.tsx
// Wraps the main site Footer and page content.
// Renders nothing on /learn/* routes so the player page is shell-free.
//
// The header is passed as a slot prop from layout.tsx (a Server Component),
// which keeps HeaderServer in the Server Component tree regardless of this
// file having "use client". SiteShell conditionally renders it based on route.

import { usePathname } from "next/navigation";
import Footer from "./Footer";

interface SiteShellProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

export default function SiteShell({ header, children }: SiteShellProps) {
  const pathname = usePathname();
  const isPlayer = pathname.startsWith("/learn/") || pathname === "/learn";

  if (isPlayer) {
    // Player pages manage their own layout — skip the site shell entirely.
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </>
  );
}
