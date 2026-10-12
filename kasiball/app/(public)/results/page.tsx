"use client";

import { useEffect, useState, Suspense } from "react";
import { api } from "@/app/lib/api";
import {
  getDefaultSeason,
  getSeasonAgeGroups,
  type PublicAgeGroup,
  type PublicSeason,
} from "@/app/lib/season-context";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";

type Fixture = {
  id: string;
  roundNumber: number;
  scheduled_date: string | null;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  match: { homeScore: number; awayScore: number; status: string } | null;
};

function ResultsInner() {
  const [seasons, setSeasons] = useState<PublicSeason[]>([]);
  const [ageGroups, setAgeGroups] = useState<PublicAgeGroup[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [ageGroupId, setAgeGroupId] = useState("");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setSeasonId(def?.id ?? "");
    })();
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    (async () => {
      const ags = await getSeasonAgeGroups(seasonId);
      setAgeGroups(ags);
      setAgeGroupId(ags[0]?.id ?? "");
    })();
  }, [seasonId]);

  useEffect(() => {
    if (!ageGroupId) {
      setFixtures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const res = await api.getPublicFixtures(ageGroupId);
      if (res.success) setFixtures(res.data as Fixture[]);
      else setError(res.error);
      setLoading(false);
    })();
  }, [ageGroupId]);

  const completed = fixtures
    .filter(
      (fixture) =>
        fixture.status === "COMPLETED" ||
        fixture.match?.status === "COMPLETED"
    )
    .reverse();

  return (
    <>
      <PublicPageHeader
        eyebrow="KasiBall matchday centre"
        title="Completed matches & verified scores"
        description="Official scores recorded for completed league fixtures."
      />
      <Container>
        <div className="py-8">

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

        {loading ? (
          <LoadingState />
        ) : completed.length === 0 ? (
          <p className="mt-6 text-base text-kasi-muted">No completed results are available for this age group.</p>
        ) : (
          <ul className="mt-6 divide-y divide-kasi-border border-y border-kasi-border">
            {completed.map((f) => (
              <li key={f.id} className="grid gap-3 py-4 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-center">
                <div className="text-sm text-kasi-muted">
                  <p className="font-semibold text-kasi-ink">Round {f.roundNumber}</p>
                  <p>{f.scheduled_date ? new Date(f.scheduled_date).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" }) : "Date to be confirmed"}</p>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center">
                  <span className="min-w-0 break-words text-sm font-semibold text-kasi-ink sm:text-right">{f.homeTeam.name}</span>
                  <span className="whitespace-nowrap bg-kasi-green px-3 py-1.5 font-bold text-white">
                    {f.match?.homeScore} - {f.match?.awayScore}
                  </span>
                  <span className="min-w-0 break-words text-sm font-semibold text-kasi-ink sm:text-left">{f.awayTeam.name}</span>
                </div>
                <StatusBadge status="COMPLETED" />
              </li>
            ))}
          </ul>
        )}
        </div>
      </Container>
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResultsInner />
    </Suspense>
  );
}