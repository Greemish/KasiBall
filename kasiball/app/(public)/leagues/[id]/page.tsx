"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
import type { PublicAgeGroup, PublicSeason } from "@/app/lib/season-context";
import { Alert } from "@/components/Alert";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";

type SeasonDetail = PublicSeason & { ageGroups: PublicAgeGroup[] };

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

type Standing = {
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

function formatDate(value: string | null) {
  if (!value) return "Date to be confirmed";
  return new Date(value).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(value: string | null) {
  if (!value) return "Time to be confirmed";
  const date = new Date(value);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes()
  ).padStart(2, "0")}`;
}

function isCompleted(fixture: Fixture) {
  return fixture.status === "COMPLETED" || fixture.match?.status === "COMPLETED";
}

export default function LeagueSeasonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [season, setSeason] = useState<SeasonDetail | null>(null);
  const [seasons, setSeasons] = useState<PublicSeason[]>([]);
  const [ageGroupId, setAgeGroupId] = useState("");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let current = true;
    setLoading(true);
    Promise.all([api.getPublicSeason(id), api.getPublicSeasons()]).then(
      ([seasonResult, seasonsResult]) => {
        if (!current) return;
        if (!seasonResult.success) {
          setError(seasonResult.error || "Unable to load this competition.");
          setLoading(false);
          return;
        }
        const loadedSeason = seasonResult.data as SeasonDetail;
        setSeason(loadedSeason);
        setAgeGroupId(loadedSeason.ageGroups[0]?.id ?? "");
        if (seasonsResult.success) setSeasons(seasonsResult.data as PublicSeason[]);
        else setError(seasonsResult.error || "Unable to load the season selector.");
        setLoading(false);
      }
    );
    return () => {
      current = false;
    };
  }, [id]);

  useEffect(() => {
    if (!ageGroupId) {
      setFixtures([]);
      setStandings([]);
      setDataLoading(false);
      return;
    }
    let current = true;
    setDataLoading(true);
    Promise.all([
      api.getPublicFixtures(ageGroupId),
      api.getPublicStandings(ageGroupId),
    ]).then(([fixtureResult, standingsResult]) => {
      if (!current) return;
      if (fixtureResult.success) setFixtures(fixtureResult.data as Fixture[]);
      else setError(fixtureResult.error || "Unable to load fixtures.");
      if (standingsResult.success) setStandings(standingsResult.data as Standing[]);
      else setError(standingsResult.error || "Unable to load standings.");
      setDataLoading(false);
    });
    return () => {
      current = false;
    };
  }, [ageGroupId]);

  if (loading) {
    return <Container><div className="py-8"><LoadingState /></div></Container>;
  }
  if (!season) {
    return <Container><div className="py-8"><Alert level="error">{error || "Season not found."}</Alert></div></Container>;
  }

  const ageGroup = season.ageGroups.find((group) => group.id === ageGroupId);
  const completedMatches = fixtures.filter(isCompleted).length;
  const nextFixture = fixtures.find((fixture) => !isCompleted(fixture));

  return (
    <Container>
      <div className="mx-auto max-w-5xl py-7">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm">
          <Link href="/leagues" className="font-medium text-kasi-green underline underline-offset-4">Leagues</Link>
          <span className="px-2 text-kasi-muted">/</span>
          <span className="text-kasi-muted">{season.name}</span>
        </nav>

        <header className="border-b border-kasi-border pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">KasiBall league registry</p>
              <h1 className="mt-1 text-2xl font-bold text-kasi-green sm:text-3xl">{season.name}</h1>
              <p className="mt-2 text-base text-kasi-muted">
                {new Date(season.startDate).toLocaleDateString("en-ZA")} - {new Date(season.endDate).toLocaleDateString("en-ZA")}
              </p>
            </div>
            <StatusBadge status={season.status} />
          </div>
        </header>

        {error && <div className="mt-5"><Alert level="error">{error}</Alert></div>}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="form-field">
            <span className="form-label">Season</span>
            <select
              value={season.id}
              onChange={(event) => router.push(`/leagues/${event.target.value}`)}
              className="form-input min-h-11 text-base"
            >
              {seasons.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Age category</span>
            <select
              value={ageGroupId}
              onChange={(event) => setAgeGroupId(event.target.value)}
              className="form-input min-h-11 text-base"
            >
              {season.ageGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </label>
        </div>

        <section className="mt-6 grid divide-y divide-kasi-border border-y border-kasi-border bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-label="Competition summary">
          <div className="px-4 py-4">
            <p className="text-sm text-kasi-muted">Participating teams</p>
            <p className="mt-1 text-2xl font-bold text-kasi-green">{dataLoading ? "-" : standings.length}</p>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-kasi-muted">Completed matches</p>
            <p className="mt-1 text-2xl font-bold text-kasi-green">{dataLoading ? "-" : completedMatches}</p>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-kasi-muted">Age categories</p>
            <p className="mt-1 text-2xl font-bold text-kasi-green">{season.ageGroups.length}</p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="league-standings">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-kasi-border pb-3">
            <div>
              <p className="eyebrow">{ageGroup?.name ?? "Age category"}</p>
              <h2 id="league-standings" className="mt-1 text-xl font-bold text-kasi-ink">League standings table</h2>
            </div>
            <Link href={`/standings?seasonId=${season.id}`} className="text-sm font-semibold text-kasi-green underline underline-offset-4">Full standings</Link>
          </div>
          {dataLoading ? (
            <LoadingState />
          ) : standings.length === 0 ? (
            <p className="py-5 text-base text-kasi-muted">No standings are available for this age category yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="table-base min-w-[680px]">
                <thead>
                  <tr>
                    <th scope="col">Pos</th><th scope="col">Club / team</th><th scope="col">P</th><th scope="col">W</th><th scope="col">D</th><th scope="col">L</th><th scope="col">GD</th><th scope="col">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.teamId}>
                      <td>{row.position}</td>
                      <td>
                        <Link href={`/teams/${row.teamId}`} className="font-semibold text-kasi-green underline underline-offset-4">
                          {row.clubName ?? row.teamName}
                        </Link>
                        {row.clubName && <span className="ml-2 text-sm text-kasi-muted">{row.teamName}</span>}
                      </td>
                      <td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td className="font-bold text-kasi-green">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-8 border-t border-kasi-border pt-6 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Registered teams</p>
            <h2 className="mt-1 text-xl font-bold text-kasi-ink">Participating clubs</h2>
            {dataLoading ? <LoadingState /> : standings.length === 0 ? (
              <p className="mt-3 text-base text-kasi-muted">No participating teams are listed yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-kasi-border border-y border-kasi-border">
                {standings.map((row) => (
                  <li key={row.teamId}>
                    <Link href={`/teams/${row.teamId}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <span className="font-semibold text-kasi-green">{row.clubName ?? row.teamName}</span>
                      <span className="text-sm text-kasi-muted">{row.teamName}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="eyebrow">Next matchday</p>
            <h2 className="mt-1 text-xl font-bold text-kasi-ink">Upcoming fixture</h2>
            {dataLoading ? <LoadingState /> : !nextFixture ? (
              <p className="mt-3 text-base text-kasi-muted">No upcoming scheduled fixture for this age category.</p>
            ) : (
              <div className="mt-3 border-l-4 border-kasi-gold bg-kasi-surface p-4">
                <p className="text-sm font-semibold text-kasi-muted">Round {nextFixture.roundNumber}</p>
                <p className="mt-1 text-base font-semibold text-kasi-ink">{formatDate(nextFixture.scheduled_date)} · {formatTime(nextFixture.kickoff_time)}</p>
                <p className="mt-2 text-base text-kasi-ink">{nextFixture.homeTeam.name} vs {nextFixture.awayTeam.name}</p>
                <p className="mt-1 text-sm text-kasi-muted">{nextFixture.ground?.name ?? "Venue to be confirmed"}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Container>
  );
}