"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api } from "@/app/lib/api";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/seasons", label: "Seasons Management" },
  { href: "/admin/team-applications", label: "Team Applications" },
  { href: "/admin/teams", label: "Teams Directory" },
  { href: "/admin/clubs", label: "Clubs" },
  { href: "/admin/players", label: "Players Directory" },
  { href: "/admin/verification", label: "Player Verification" },
  { href: "/admin/fixtures", label: "Fixtures" },
  { href: "/admin/matches", label: "Match Operations" },
  { href: "/admin/grounds", label: "Grounds" },
  { href: "/admin/referees", label: "Referees" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    await api.logout();
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login?redirect=/admin/dashboard");
  }, [loading, user, router]);

  if (loading) {
    return (
      <Container>
        <div className="py-12"><LoadingState /></div>
      </Container>
    );
  }

  if (!user) return null;

  if (user.role !== "ADMIN") {
    return (
      <Container>
        <div className="py-12">
          <Alert level="error" title="Access denied">
            This area is for administrators only. You are signed in as {user.role}.
          </Alert>
        </div>
      </Container>
    );
  }

  const navLinkClass = (href: string) =>
    `block border-l-2 px-3 py-2.5 text-sm font-medium transition ${
      pathname === href
        ? "border-kasi-green bg-kasi-surface text-kasi-green"
        : "border-transparent text-kasi-ink hover:border-kasi-border hover:bg-kasi-surface"
    }`;
  const currentPageLabel =
    NAV.find((item) => item.href === pathname)?.label ?? "System Operations";

  return (
    <div className="min-h-screen bg-kasi-surface">
      <header className="bg-kasi-green-dark text-white">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <Link href="/admin/dashboard" className="border-l-4 border-kasi-gold pl-3">
              <p className="text-xs font-bold uppercase text-kasi-gold">KasiBall Portal Admin</p>
              <p className="mt-1 text-lg font-semibold">System Operations / {currentPageLabel}</p>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm font-medium text-white/80 hover:text-kasi-gold">
                Public site
              </Link>
              <span className="hidden text-sm text-white/80 sm:inline">{user.email}</span>
              <button
                onClick={logout}
                className="border border-white/40 px-3 py-2 text-sm font-semibold text-white hover:border-kasi-gold hover:text-kasi-gold"
              >
                Log out
              </button>
            </div>
          </div>
        </Container>
      </header>

      <Container>
        <div className="py-5 sm:py-7">
          <details className="mb-5 border border-kasi-border bg-white lg:hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-kasi-ink">
              Admin navigation
            </summary>
            <nav aria-label="Admin navigation" className="border-t border-kasi-border p-2">
              <ul className="grid gap-1 sm:grid-cols-2">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={navLinkClass(item.href)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>

          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
            <aside className="hidden lg:block">
              <p className="eyebrow mb-2 px-3">Administration</p>
              <nav aria-label="Admin navigation">
                <ul className="space-y-1">
                  {NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={pathname === item.href ? "page" : undefined}
                        className={navLinkClass(item.href)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
            <main className="min-w-0">{children}</main>
          </div>
        </div>
      </Container>
    </div>
  );
}