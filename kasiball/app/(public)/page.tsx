"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/lib/api";
import {
  getSeasonAgeGroups,
  type PublicAgeGroup,
  type PublicSeason,
} from "@/app/lib/season-context";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
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

type Standing = {
  position: number;
  teamId: string;
  teamName: string;
  clubName: string | null;
  played: number;
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

export default function HomePage() {
  const [seasons, setSeasons] = useState<PublicSeason[]>([]);
  const [ageGroup, setAgeGroup] = useState<PublicAgeGroup | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;

    const load = async () => {
      const seasonResponse = await api.getPublicSeasons();
      if (!current) return;
      if (!seasonResponse.success) {
        setError(seasonResponse.error || "Unable to load public competitions.");
        setLoading(false);
        return;
      }

      const availableSeasons = seasonResponse.data as PublicSeason[];
      setSeasons(availableSeasons);
      const activeSeason =
        availableSeasons.find((season) => season.status === "ACTIVE") ??
        availableSeasons[0];
      if (!activeSeason) {
        setLoading(false);
        return;
      }

      const ageGroups = await getSeasonAgeGroups(activeSeason.id);
      if (!current) return;
      const activeAgeGroup = ageGroups[0] ?? null;
      setAgeGroup(activeAgeGroup);
      if (!activeAgeGroup) {
        setLoading(false);
        return;
      }

      const [fixtureResponse, standingsResponse] = await Promise.all([
        api.getPublicFixtures(activeAgeGroup.id),
        api.getPublicStandings(activeAgeGroup.id),
      ]);
      if (!current) return;
      const loadErrors: string[] = [];
      if (fixtureResponse.success) setFixtures(fixtureResponse.data as Fixture[]);
      else loadErrors.push(fixtureResponse.error || "Unable to load fixtures.");
      if (standingsResponse.success)
        setStandings(standingsResponse.data as Standing[]);
      else loadErrors.push(standingsResponse.error || "Unable to load standings.");
      if (loadErrors.length > 0) setError(loadErrors.join(" "));
      setLoading(false);
    };

    load();
    return () => {
      current = false;
    };
  }, []);

  const currentSeason =
    seasons.find((season) => season.status === "ACTIVE") ?? seasons[0];
  const upcoming = fixtures
    .filter(
      (fixture) =>
        fixture.status !== "COMPLETED" &&
        fixture.match?.status !== "COMPLETED"
    )
    .slice(0, 3);
  const recentResults = fixtures
    .filter(
      (fixture) =>
        fixture.status === "COMPLETED" ||
        fixture.match?.status === "COMPLETED"
    )
    .reverse()
    .slice(0, 4);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-kasi-green-dark text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=2000&q=85')",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-kasi-ink/70" />
        <Container>
          <div className="flex min-h-[390px] flex-col justify-center py-14 sm:min-h-[450px] sm:py-16">
            <p className="mb-4 text-sm font-bold uppercase text-kasi-gold">
              South African grassroots development
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Unlocking raw township football talent to the world
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
              Structured matches, verified results and player records help communities follow youth football and give every performance a place to be recognised.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/leagues" className="btn-gold min-h-11 uppercase">
                Explore active leagues
              </Link>
              <Link
                href="/auth/register"
                className="btn min-h-11 border border-white text-white hover:bg-white hover:text-kasi-ink"
              >
                Register your squad
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section id="player-search" className="border-b border-kasi-border bg-kasi-surface py-8 sm:py-10">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:items-end">
            <div>
              <p className="eyebrow">Player directory</p>
              <h2 className="mt-1 text-2xl font-bold text-kasi-ink">Find a player</h2>
              <p className="mt-2 text-base text-kasi-muted">
                Search public player records by name. Sensitive youth information is not displayed.
              </p>
            </div>
            <form action="/players" role="search" className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="home-player-search" className="sr-only">
                Player name
              </label>
              <input
                id="home-player-search"
                type="search"
                name="q"
                minLength={2}
                placeholder="Enter a player name"
                className="form-input min-h-11 flex-1 text-base"
              />
              <button type="submit" className="btn-primary min-h-11 px-6 uppercase">
                Find players
              </button>
            </form>
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-12">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-kasi-border pb-4">
            <div>
              <p className="eyebrow">Matchday centre</p>
              <h2 className="mt-1 text-2xl font-bold text-kasi-ink">Upcoming fixtures</h2>
              <p className="mt-1 text-base text-kasi-muted">
                {currentSeason?.name}{ageGroup ? ` · ${ageGroup.name}` : ""}
              </p>
            </div>
            <Link href="/fixtures" className="text-sm font-bold text-kasi-green underline underline-offset-4">
              All fixtures
            </Link>
          </div>

          {loading ? (
            <LoadingState />
          ) : upcoming.length === 0 ? (
            <p className="py-6 text-base text-kasi-muted">
              No upcoming fixtures have been published for this age group.
            </p>
          ) : (
            <ul className="divide-y divide-kasi-border border-b border-kasi-border">
              {upcoming.map((fixture) => (
                <li key={fixture.id} className="grid gap-3 py-5 sm:grid-cols-[170px_minmax(0,1fr)_auto] sm:items-center">
                  <div className="text-sm text-kasi-muted">
                    <p className="font-semibold text-kasi-ink">Round {fixture.roundNumber}</p>
                    <p>{formatDate(fixture.scheduled_date)} · {formatTime(fixture.kickoff_time)}</p>
                    {fixture.ground && <p>{fixture.ground.name}</p>}
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center sm:gap-5">
                    <span className="min-w-0 break-words text-base font-semibold text-kasi-ink sm:text-right">{fixture.homeTeam.name}</span>
                    <span className="text-xs font-bold uppercase text-kasi-muted">vs</span>
                    <span className="min-w-0 break-words text-base font-semibold text-kasi-ink sm:text-left">{fixture.awayTeam.name}</span>
                  </div>
                  <StatusBadge status={fixture.status} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <section className="bg-kasi-surface py-10 sm:py-12">
        <Container>
          <div className="grid min-w-0 gap-10 lg:grid-cols-2">
            <div className="min-w-0">
              <div className="flex items-end justify-between gap-3 border-b border-kasi-border pb-4">
                <div>
                  <p className="eyebrow">Verified scores</p>
                  <h2 className="mt-1 text-2xl font-bold text-kasi-ink">Latest results</h2>
                </div>
                <Link href="/results" className="text-sm font-bold text-kasi-green underline underline-offset-4">All results</Link>
              </div>
              {loading ? (
                <LoadingState />
              ) : recentResults.length === 0 ? (
                <p className="py-6 text-base text-kasi-muted">No completed matches have been recorded yet.</p>
              ) : (
                <ul className="divide-y divide-kasi-border">
                  {recentResults.map((fixture) => (
                    <li key={fixture.id} className="py-4">
                      <p className="mb-2 text-sm text-kasi-muted">Round {fixture.roundNumber} · {formatDate(fixture.scheduled_date)}</p>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center">
                        <span className="min-w-0 break-words text-sm font-semibold text-kasi-ink sm:text-right">{fixture.homeTeam.name}</span>
                        <span className="bg-kasi-green px-3 py-1.5 text-base font-bold text-white">
                          {fixture.match?.homeScore} - {fixture.match?.awayScore}
                        </span>
                        <span className="min-w-0 break-words text-sm font-semibold text-kasi-ink sm:text-left">{fixture.awayTeam.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-end justify-between gap-3 border-b border-kasi-border pb-4">
                <div>
                  <p className="eyebrow">Current competition</p>
                  <h2 className="mt-1 text-2xl font-bold text-kasi-ink">League standings</h2>
                </div>
                <Link
                  href={currentSeason ? `/standings?seasonId=${currentSeason.id}` : "/standings"}
                  className="text-sm font-bold text-kasi-green underline underline-offset-4"
                >
                  Full table
                </Link>
              </div>
              <p className="mt-3 text-sm font-medium text-kasi-muted">
                {currentSeason?.name}{ageGroup ? ` · ${ageGroup.name}` : ""}
              </p>
              {loading ? (
                <LoadingState />
              ) : standings.length === 0 ? (
                <p className="py-6 text-base text-kasi-muted">Standings will appear when match records are available.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="table-base min-w-[430px]">
                    <thead>
                      <tr>
                        <th scope="col">Pos</th>
                        <th scope="col">Club</th>
                        <th scope="col">P</th>
                        <th scope="col">GD</th>
                        <th scope="col">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.slice(0, 5).map((row) => (
                        <tr key={row.teamId}>
                          <td>{row.position}</td>
                          <td className="font-medium">{row.clubName ?? row.teamName}</td>
                          <td>{row.played}</td>
                          <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                          <td className="font-bold text-kasi-green">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section id="leagues" className="py-10 sm:py-12">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-kasi-border pb-4">
            <div>
              <p className="eyebrow">Competition registry</p>
              <h2 className="mt-1 text-2xl font-bold text-kasi-ink">Available seasons</h2>
            </div>
            <Link href="/leagues" className="text-sm font-bold text-kasi-green underline underline-offset-4">
              Browse standings
            </Link>
          </div>
          {error && <p role="status" className="mt-4 text-base text-red-700">{error}</p>}
          {loading ? (
            <LoadingState />
          ) : seasons.length === 0 ? (
            <p className="py-6 text-base text-kasi-muted">No public seasons are available yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-kasi-border border-b border-kasi-border">
              {seasons.map((season) => (
                <li key={season.id}>
                  <Link
                    href={`/leagues/${season.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-kasi-green"
                  >
                    <span className="text-base font-semibold">{season.name}</span>
                    <StatusBadge status={season.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}