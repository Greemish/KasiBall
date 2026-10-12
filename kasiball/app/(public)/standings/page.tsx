"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/app/lib/api";
import {
  getDefaultSeason,
  getSeasonAgeGroups,
  type PublicAgeGroup,
  type PublicSeason,
} from "@/app/lib/season-context";
import { Container } from "@/components/layout/Container";
import { Table, type Column } from "@/components/Table";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";

type StandingsRow = {
  position: number;
  teamId: string;
  teamName: string;
  clubName: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

function StandingsInner() {
  const params = useSearchParams();
  const [seasons, setSeasons] = useState<PublicSeason[]>([]);
  const [ageGroups, setAgeGroups] = useState<PublicAgeGroup[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [ageGroupId, setAgeGroupId] = useState("");
  const [rows, setRows] = useState<StandingsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load seasons + pick default
  useEffect(() => {
    (async () => {
      const all = await api.getPublicSeasons();
      if (!all.success) {
        setError("Failed to load seasons");
        setLoading(false);
        return;
      }
      setSeasons(all.data as PublicSeason[]);
      const def = await getDefaultSeason();
      const chosen = params.get("seasonId") ?? def?.id ?? "";
      setSeasonId(chosen);
    })();
  }, [params]);

  // Load age groups when season changes
  useEffect(() => {
    if (!seasonId) return;
    (async () => {
      const ags = await getSeasonAgeGroups(seasonId);
      setAgeGroups(ags);
      setAgeGroupId(ags[0]?.id ?? "");
    })();
  }, [seasonId]);

  // Load standings when age group changes
  useEffect(() => {
    if (!ageGroupId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const res = await api.getPublicStandings(ageGroupId);
      if (res.success) setRows(res.data as StandingsRow[]);
      else setError(res.error);
      setLoading(false);
    })();
  }, [ageGroupId]);

  const columns: Column<StandingsRow>[] = [
    { key: "position", header: "#" },
    { key: "teamName", header: "Team" },
    { key: "played", header: "P" },
    { key: "won", header: "W" },
    { key: "drawn", header: "D" },
    { key: "lost", header: "L" },
    { key: "goalsFor", header: "GF" },
    { key: "goalsAgainst", header: "GA" },
    { key: "goalDifference", header: "GD" },
    {
      key: "points",
      header: "Pts",
      render: (r) => <span className="font-bold text-kasi-green">{r.points}</span>,
    },
  ];

  return (
    <Container>
      <div className="py-8">
        <header className="border-b border-kasi-border pb-5">
          <p className="eyebrow">KasiBall competition registry</p>
          <h1 className="mt-1 text-2xl font-bold text-kasi-green sm:text-3xl">
            Live grassroots league table
          </h1>
          <p className="mt-2 text-base text-kasi-muted">
            Standings are calculated from recorded match results.
          </p>
        </header>

        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="form-input max-w-xs"
            aria-label="Season"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={ageGroupId}
            onChange={(e) => setAgeGroupId(e.target.value)}
            className="form-input max-w-xs"
            aria-label="Age group"
          >
            {ageGroups.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

        <div className="mt-6">
          <Table
            columns={columns}
            data={rows}
            loading={loading}
            emptyMessage="No standings yet for this age group."
          />
        </div>
      </div>
    </Container>
  );
}

export default function StandingsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StandingsInner />
    </Suspense>
  );
}