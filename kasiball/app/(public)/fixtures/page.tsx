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
  kickoff_time: string | null;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  ground: { id: string; name: string } | null;
  match: { homeScore: number; awayScore: number; status: string } | null;
};

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
  const matchdays = Array.from(
    upcoming.reduce((groups, fixture) => {
      const key = fixture.scheduled_date?.slice(0, 10) ?? "9999-99-99";
      const group = groups.get(key) ?? [];
      group.push(fixture);
      groups.set(key, group);
      return groups;
    }, new Map<string, Fixture[]>())
  ).sort(([left], [right]) => left.localeCompare(right));

  return (
    <div className="bg-kasi-surface pb-10">
      <PublicPageHeader
        eyebrow="KasiBall matchday centre"
        title="Upcoming Grassroots Fixtures"
        description="Match dates and kickoff times are shown as published by the league."
      />

      <Container>
        {error && <div className="mt-5"><Alert level="error">{error}</Alert></div>}

        <div className="grid gap-6 py-6 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:gap-8">
          <aside className="h-fit border border-kasi-border bg-white p-4">
            <h2 className="border-b-2 border-kasi-green pb-2 text-base font-bold text-kasi-green">
              Refine matches
            </h2>
            <div className="mt-4 space-y-4">
              <div className="form-field">
                <label htmlFor="fixture-season" className="form-label text-xs uppercase tracking-wide">
                  Season
                </label>
                <select
                  id="fixture-season"
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="form-input"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="fixture-age-group" className="form-label text-xs uppercase tracking-wide">
                  Age group
                </label>
                <select
                  id="fixture-age-group"
                  value={ageGroupId}
                  onChange={(e) => setAgeGroupId(e.target.value)}
                  className="form-input"
                >
                  {ageGroups.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          <section aria-label="Upcoming matchday fixtures">
            {loading ? (
              <LoadingState />
            ) : matchdays.length === 0 ? (
              <div className="border border-kasi-border bg-white p-5 text-sm text-kasi-muted">
                No upcoming fixtures.
              </div>
            ) : (
              <div className="space-y-6">
                {matchdays.map(([dateKey, dayFixtures]) => {
                  const dateLabel =
                    dateKey === "9999-99-99"
                      ? "Date to be confirmed"
                      : new Date(`${dateKey}T12:00:00`).toLocaleDateString(
                          "en-ZA",
                          { weekday: "long", day: "numeric", month: "long" }
                        );

                  return (
                    <section key={dateKey}>
                      <h2 className="border-b-2 border-kasi-green pb-2 text-sm font-bold text-kasi-green">
                        Matchday schedule
                        <span className="font-normal text-kasi-ink">
                          {" "}({dateLabel})
                        </span>
                      </h2>
                      <ul className="mt-3 space-y-2">
                        {dayFixtures.map((fixture) => (
                          <li
                            key={fixture.id}
                            className="grid gap-3 border border-kasi-border bg-white p-4 sm:grid-cols-[minmax(140px,1fr)_minmax(220px,2fr)_auto] sm:items-center"
                          >
                            <div className="text-xs">
                              <p className="font-bold uppercase text-kasi-green">
                                {ageGroups.find((group) => group.id === ageGroupId)?.name ?? "Grassroots league"}
                              </p>
                              <p className="mt-1 font-bold text-kasi-gold">
                                Kickoff: {fmtTime(fixture.kickoff_time) || "TBC"}
                              </p>
                              <p className="mt-1 text-kasi-muted">
                                {fixture.ground?.name ?? "Venue: TBC"}
                              </p>
                              <p className="mt-1 text-kasi-muted">
                                Round {fixture.roundNumber}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 text-center text-sm font-semibold sm:justify-center">
                              <span className="flex-1 sm:flex-none">{fixture.homeTeam.name}</span>
                              <span className="text-xs font-bold text-kasi-muted">vs</span>
                              <span className="flex-1 sm:flex-none">{fixture.awayTeam.name}</span>
                            </div>
                            <div className="sm:text-right">
                              <StatusBadge status={fixture.status} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </Container>
    </div>
  );
}

export default function FixturesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <FixturesInner />
    </Suspense>
  );
}