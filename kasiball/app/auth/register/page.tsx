"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/Alert";
import { FormField } from "@/components/FormField";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await api.register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
    });

    if (!res.success) {
      setError(res.error || "Unable to register");
      setLoading(false);
      return;
    }

    router.push("/auth/login?redirect=/manager");
  };

  return (
    <Container>
      <div className="mx-auto max-w-md py-12">
        <h1 className="text-2xl font-bold text-kasi-green">Register as a manager</h1>
        <p className="mt-1 text-sm text-kasi-muted">
          Create an account to register your club and teams.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <Alert level="error">{error}</Alert>}

          <FormField label="First name" htmlFor="firstName">
            <input id="firstName" required value={form.firstName} onChange={set("firstName")} className="form-input" />
          </FormField>
          <FormField label="Last name" htmlFor="lastName">
            <input id="lastName" required value={form.lastName} onChange={set("lastName")} className="form-input" />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <input id="email" type="email" required value={form.email} onChange={set("email")} className="form-input" />
          </FormField>
          <FormField label="Phone (optional)" htmlFor="phone">
            <input id="phone" value={form.phone} onChange={set("phone")} className="form-input" />
          </FormField>
          <FormField label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={set("password")}
              className="form-input"
            />
          </FormField>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-kasi-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-kasi-green hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </Container>
  );
}