"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { api } from "@/app/lib/api";

export function SessionNav() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const logout = async () => {
    await api.logout();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return <span className="text-sm text-white/70">…</span>;
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="rounded bg-kasi-gold px-3 py-1.5 text-sm font-semibold text-kasi-ink hover:bg-kasi-gold-dark"
      >
        Log in
      </Link>
    );
  }

  const dashboard =
    user.role === "ADMIN"
      ? "/admin/dashboard"
      : user.role === "REFEREE"
      ? "/referee"
      : "/manager";

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href={dashboard}
        className="font-medium text-white hover:text-kasi-gold"
      >
        {user.role === "ADMIN"
          ? "Admin"
          : user.role === "REFEREE"
          ? "Referee"
          : "Manager"}
      </Link>
      <button
        onClick={logout}
        className="rounded px-2 py-1 text-white/80 hover:bg-kasi-green-dark"
      >
        Log out
      </button>
    </div>
  );
}