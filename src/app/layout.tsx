import type { Metadata } from "next";
import { Hanken_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/layout/SiteShell";
import HeaderServer from "@/components/layout/HeaderServer";
import QueryProvider from "../app/providers/QueryProvider";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import NotificationToast from "@/components/ui/NotificationToast";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "EduGenie – Join the Future of Learning",
  description:
    "AI-driven e-learning platform for students and instructors. Sign in or create your account.",
     icons: {
    icon: '/favicon-modified.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <CartProvider>
            <NotificationProvider>
              <SiteShell header={<HeaderServer />}>
                {children}
              </SiteShell>
              <NotificationToast />
            </NotificationProvider>
          </CartProvider>
        </QueryProvider>
      </body>
      
    </html>
  );
}
