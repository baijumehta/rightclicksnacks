import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth.ts";
import { signOut } from "./actions/auth.ts";
import { ThemeToggle, themeBootScript } from "@/components/theme-toggle.tsx";

// Right Click's brand typeface. next/font self-hosts it, so there is no
// request to Google and no layout shift when it swaps in.
const mulish = Mulish({
  subsets: ["latin"],
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
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Snacks
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
