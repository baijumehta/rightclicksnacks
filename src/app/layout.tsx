import type { Metadata } from "next";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth.ts";
import { signOut } from "./actions/auth.ts";
import { ThemeToggle, themeBootScript } from "@/components/theme-toggle.tsx";

// Mulish, from the design system's own variable-font files rather than a CDN
// copy, so the app renders in exactly the weights the brand ships.
const mulish = localFont({
  src: [
    { path: "./fonts/Mulish-VariableFont_wght.ttf", style: "normal", weight: "200 1000" },
    { path: "./fonts/Mulish-Italic-VariableFont_wght.ttf", style: "italic", weight: "200 1000" },
  ],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Snacks",
  description: "Request, vote on and budget the office snack order.",
};

const NAV = [
  { href: "/", label: "This cycle" },
  { href: "/catalog", label: "Catalog" },
  { href: "/order", label: "Shopping list" },
  { href: "/history", label: "History" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);

  return (
    <html lang="en" className={mulish.variable} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint, so a dark-mode
            visitor never gets a white flash on the way in. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh">
        <div className="brand-rule h-1 w-full" />
        <header className="no-print border-b border-line bg-surface">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              {/* The official lockup, light and reversed, swapped by theme. */}
              <Image
                src="/brand/right-click-lockup.png"
                alt="Right Click"
                width={116}
                height={28}
                priority
                className="h-7 w-auto dark:hidden"
              />
              <Image
                src="/brand/right-click-lockup-white.png"
                alt="Right Click"
                width={116}
                height={28}
                priority
                className="hidden h-7 w-auto dark:block"
              />
              <span className="border-l border-line pl-2.5 text-lg font-bold tracking-tight">
                Snacks
              </span>
            </Link>
            {user ? (
              <>
                <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {NAV.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user.isAdmin ? (
                    <Link href="/admin" className="text-muted transition-colors hover:text-ink">
                      Admin
                    </Link>
                  ) : null}
                </nav>
                <div className="ml-auto flex items-center gap-3">
                  <ThemeToggle />
                  <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
                  <form action={signOut}>
                    <button type="submit" className="text-sm text-muted hover:text-ink">
                      Sign out
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
