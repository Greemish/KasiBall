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

type Fixture = {
  id: string;
  roundNumber: number;
  scheduled_date: string | null;
  kickoff_time: string | null;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  ground: { id: string; name: string } | null;
  match: { homeScore: number; awayScore: number; status: string } | null;
};

function fmtDate(d: string | null) {
  if (!d) return "TBC";
  return new Date(d).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function fmtTime(t: string | null) {
  if (!t) return "";
  const d = new Date(t);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")}`;
}

function FixturesInner() {
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

  const upcoming = fixtures.filter(
    (fixture) =>
      fixture.status !== "COMPLETED" &&
      fixture.match?.status !== "COMPLETED"
  );

  return (
    <Container>
      <div className="py-8">
        <header className="border-b border-kasi-border pb-5">
          <p className="eyebrow">KasiBall matchday centre</p>
          <h1 className="mt-1 text-2xl font-bold text-kasi-green sm:text-3xl">
            Upcoming grassroots fixtures
          </h1>
          <p className="mt-2 text-base text-kasi-muted">
            Match dates and kickoff times are shown as published by the league.
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

        {loading ? (
          <LoadingState />
        ) : upcoming.length === 0 ? (
          <p className="mt-6 text-base text-kasi-muted">
            No upcoming fixtures.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {upcoming.map((f) => (
              <li key={f.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-kasi-muted">
                    <div className="font-medium text-kasi-ink">
                      Round {f.roundNumber}
                    </div>
                    <div>
                      {fmtDate(f.scheduled_date)}{" "}
                      {fmtTime(f.kickoff_time) && `· ${fmtTime(f.kickoff_time)}`}
                    </div>
                    {f.ground && <div>{f.ground.name}</div>}
                  </div>

                  <div className="flex flex-1 items-center justify-center gap-4 text-center">
                    <span className="flex-1 text-right font-semibold">
                      {f.homeTeam.name}
                    </span>
                    <span className="text-xs font-bold text-kasi-muted">vs</span>
                    <span className="flex-1 text-left font-semibold">
                      {f.awayTeam.name}
                    </span>
                  </div>

                  <StatusBadge status={f.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

export default function FixturesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <FixturesInner />
    </Suspense>
  );
}