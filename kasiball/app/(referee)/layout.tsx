"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { api } from "@/app/lib/api";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";

export default function RefereeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/referee");
    }
  }, [loading, user, router]);

  const logout = async () => {
    await api.logout();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <Container>
        <div className="py-12"><LoadingState /></div>
      </Container>
    );
  }

  if (!user) return null;

  if (user.role !== "REFEREE") {
    return (
      <Container>
        <div className="py-12">
          <Alert level="error" title="Access denied">
            This area is for referees only. You are signed in as {user.role}.
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-kasi-surface">
      <header className="bg-kasi-green-dark text-white">
        <Container>
          <div className="flex items-center justify-between gap-3 py-4">
            <div className="min-w-0 border-l-4 border-kasi-gold pl-3">
              <p className="text-sm font-bold uppercase text-kasi-gold">
                KasiBall Referee Match Control
              </p>
              <p className="mt-1 truncate text-sm text-white/85">
                {user.referee
                  ? `${user.referee.firstName} ${user.referee.lastName}`
                  : user.email}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/referee"
                className="hidden px-3 py-2 text-sm font-medium text-white/90 hover:bg-kasi-green sm:inline-flex"
              >
                Assignments
              </Link>
              <Link
                href="/"
                className="hidden px-3 py-2 text-sm font-medium text-white/90 hover:bg-kasi-green sm:inline-flex"
              >
                Public site
              </Link>
              <button
                onClick={logout}
                className="min-h-10 border border-white/50 px-3 text-sm font-semibold text-white hover:border-kasi-gold hover:text-kasi-gold"
              >
                Log out
              </button>
            </div>
          </div>
        </Container>
      </header>
      <main id="main">
        <Container>
          <div className="py-5 sm:py-7">{children}</div>
        </Container>
      </main>
    </div>
  );
}