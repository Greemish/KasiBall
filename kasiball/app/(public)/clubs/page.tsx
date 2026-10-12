"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";

type Club = {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  _count?: { teams: number };
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await api.getPublicClubs();
      if (res.success) setClubs(res.data as Club[]);
      else setError(res.error);
      setLoading(false);
    })();
  }, []);

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-2xl font-bold text-kasi-green sm:text-3xl">
          Clubs
        </h1>

        {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

        {loading ? (
          <LoadingState />
        ) : clubs.length === 0 ? (
          <p className="mt-6 text-sm text-kasi-muted">No clubs yet.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((c) => (
              <Link
                key={c.id}
                href={`/clubs/${c.id}`}
                className="card transition hover:border-kasi-green hover:shadow-sm"
              >
                <h2 className="font-semibold text-kasi-ink">{c.name}</h2>
                {c.shortName && (
                  <p className="mt-1 text-xs uppercase tracking-wide text-kasi-muted">
                    {c.shortName}
                  </p>
                )}
                {c._count && (
                  <p className="mt-2 text-sm text-kasi-muted">
                    {c._count.teams} team{c._count.teams === 1 ? "" : "s"}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}