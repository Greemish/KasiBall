"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { api } from "@/app/lib/api";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/Alert";
import { FormField } from "@/components/FormField";
import { LoadingState } from "@/components/LoadingState";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await api.login({ email, password });

    if (!res.success) {
      setError(res.error || "Unable to log in");
      setLoading(false);
      return;
    }

    // Route by role.
    const role = (res.data as { role?: string })?.role;
    const target =
      redirect !== "/"
        ? redirect
        : role === "ADMIN"
        ? "/admin/dashboard"
        : role === "REFEREE"
        ? "/referee"
        : "/manager";

    router.push(target);
    router.refresh();
  };

  return (
    <Container>
      <div className="mx-auto max-w-md py-12">
        <h1 className="text-2xl font-bold text-kasi-green">Log in to KasiBall</h1>
        <p className="mt-1 text-sm text-kasi-muted">
          Managers, referees, and administrators.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <Alert level="error">{error}</Alert>}

          <FormField label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </FormField>

          <FormField label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </FormField>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-kasi-muted">
          Want to register a club?{" "}
          <Link href="/auth/register" className="font-medium text-kasi-green hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginInner />
    </Suspense>
  );
}