"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api } from "@/app/lib/api";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";

const NAV = [
  { href: "/manager", label: "Dashboard" },
  { href: "/manager/applications", label: "Applications" },
  { href: "/manager/players", label: "Players" },
];

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const logout = async () => {
    await api.logout();
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login?redirect=/manager");
  }, [loading, user, router]);

  if (loading) {
    return (
      <Container>
        <div className="py-12">
          <LoadingState />
        </div>
      </Container>
    );
  }

  if (!user) return null;

  if (user.role !== "MANAGER") {
    return (
      <Container>
        <div className="py-12">
          <Alert level="error" title="Access denied">
            This area is for managers only. You are signed in as {user.role}.
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-kasi-surface">
      <div className="bg-kasi-green-dark text-white">
        <Container>
          <div className="flex items-center justify-between py-3">
            <nav className="flex items-center gap-1" aria-label="Manager navigation">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded px-3 py-2 text-sm font-medium hover:bg-kasi-green"
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-sm text-white/80 hover:text-kasi-gold"
              >
                Public site
              </Link>

              <span className="text-sm text-white/80">
                {user.manager
                  ? `${user.manager.firstName} ${user.manager.lastName}`
                  : user.email}
              </span>

              <button
                onClick={logout}
                className="rounded px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-kasi-green"
              >
                Log out
              </button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-8">{children}</div>
      </Container>
    </div>
  );
}