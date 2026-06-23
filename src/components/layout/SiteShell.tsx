"use client";
// components/layout/SiteShell.tsx
// Wraps the main site Header + Footer.
// Renders nothing on /learn/* routes so the player page is shell-free.

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlayer = pathname.startsWith("/learn/") || pathname === "/learn";

  if (isPlayer) {
    // Player pages manage their own layout — skip the site shell entirely.
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </>
  );
}
