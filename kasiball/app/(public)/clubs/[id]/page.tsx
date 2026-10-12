"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/app/lib/api";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";

type Club = {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  teams: { id: string; name: string; ageGroup: { id: string; name: string } }[];
};

export default function ClubProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await api.getPublicClub(id);
      if (res.success) setClub(res.data as Club);
      else setError(res.error);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <Container>
        <div className="py-8"><LoadingState /></div>
      </Container>
    );
  }
  if (error || !club) {
    return (
      <Container>
        <div className="py-8"><Alert level="error">{error || "Club not found"}</Alert></div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-2xl font-bold text-kasi-green sm:text-3xl">
          {club.name}
        </h1>
        {club.shortName && (
          <p className="mt-1 text-sm uppercase tracking-wide text-kasi-muted">
            {club.shortName}
          </p>
        )}

        <h2 className="mt-8 text-xl font-bold text-kasi-green">Teams</h2>
        {club.teams.length === 0 ? (
          <p className="mt-3 text-sm text-kasi-muted">No approved teams yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {club.teams.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/teams/${t.id}`}
                  className="card flex items-center justify-between transition hover:border-kasi-green"
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="badge-info">{t.ageGroup.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}