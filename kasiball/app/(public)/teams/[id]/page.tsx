"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/app/lib/api";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";

type Team = {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  status: string;
  club: { id: string; name: string };
  ageGroup: { id: string; name: string };
  squad: { playerId: string; name: string; shirtNumber: number | null; age: number }[];
};

export default function TeamProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await api.getPublicTeam(id);
      if (res.success) setTeam(res.data as Team);
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
  if (error || !team) {
    return (
      <Container>
        <div className="py-8"><Alert level="error">{error || "Team not found"}</Alert></div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm">
          <Link href="/clubs" className="font-medium text-kasi-green underline underline-offset-4">
            Clubs
          </Link>
          <span className="px-2 text-kasi-muted">/</span>
          <Link href={`/clubs/${team.club.id}`} className="font-medium text-kasi-green underline underline-offset-4">
            {team.club.name}
          </Link>
          <span className="px-2 text-kasi-muted">/</span>
          <span className="text-kasi-muted">Team</span>
        </nav>
      </Container>

      <PublicPageHeader
        eyebrow="Verified squad roster"
        title={team.name}
        description={`${team.club.name} · ${team.ageGroup.name}`}
      />
      <Container>
        <div className="py-8">
          <div className="mb-5 flex items-center justify-between border border-kasi-border bg-white p-4">
            <div className="flex min-w-0 items-center gap-4">
              {team.logoUrl && (
            <img
              src={team.logoUrl}
              alt={`${team.name} logo`}
              width={64}
              height={64}
              className="h-16 w-16 border border-kasi-border object-contain"
            />
              )}
              <p className="text-sm text-kasi-muted">Club squad</p>
            </div>
            <StatusBadge status={team.status} />
          </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-2 border-b border-kasi-border pb-3">
          <div>
            <p className="eyebrow">Public team record</p>
            <h2 className="mt-1 text-xl font-bold text-kasi-green">Verified squad</h2>
          </div>
          <p className="text-sm text-kasi-muted">{team.squad.length} registered players</p>
        </div>
        {team.squad.length === 0 ? (
          <p className="py-5 text-base text-kasi-muted">
            No verified players registered yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Player name</th>
                  <th scope="col">Age</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {team.squad.map((p) => (
                  <tr key={p.playerId}>
                    <td>{p.shirtNumber ?? "—"}</td>
                    <td className="font-medium">
                      <Link href={`/players/${p.playerId}`} className="text-kasi-green underline underline-offset-4">
                        {p.name}
                      </Link>
                    </td>
                    <td>{p.age}</td>
                    <td><StatusBadge status="VERIFIED" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </Container>
    </>
  );
}