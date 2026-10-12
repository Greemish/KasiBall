"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";

type RefereeMatch = {
  id: string;
  status: string;
  fixture: {
    roundNumber: number;
    scheduled_date: string | null;
    kickoff_time: string | null;
    ground: { name: string } | null;
    ageGroup: { name: string };
    season: { name: string };
    homeTeam: { name: string; club: { name: string } };
    awayTeam: { name: string; club: { name: string } };
  };
};

function formatDate(value: string | null) {
  if (!value) return "Date to be confirmed";
  return new Date(value).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "Time to be confirmed";
  const date = new Date(value);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes()
  ).padStart(2, "0")}`;
}

export default function RefereeAssignmentsPage() {
  const [matches, setMatches] = useState<RefereeMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    api.getRefereeMatches().then((res) => {
      if (!current) return;
      if (res.success) setMatches(res.data as RefereeMatch[]);
      else setError(res.error || "Unable to load assigned matches.");
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-kasi-border pb-5">
        <p className="eyebrow">Referee portal</p>
        <h1 className="mt-1 text-2xl font-bold text-kasi-green sm:text-3xl">
          Assigned matches
        </h1>
        <p className="mt-2 text-base text-kasi-muted">
          Matchday details and control for fixtures assigned to you.
        </p>
      </header>

      {error && <div className="mt-5"><Alert level="error">{error}</Alert></div>}

      {loading ? (
        <LoadingState />
      ) : matches.length === 0 ? (
        <div className="mt-6 border border-dashed border-kasi-border bg-white px-5 py-10 text-center">
          <h2 className="font-semibold text-kasi-ink">No assigned matches</h2>
          <p className="mt-2 text-base text-kasi-muted">
            Fixtures assigned to your referee profile will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-kasi-border border-y border-kasi-border">
          {matches.map((match) => (
            <li key={match.id}>
              <article className="py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-kasi-muted">
                    {match.fixture.season.name} · {match.fixture.ageGroup.name} · Round {match.fixture.roundNumber}
                  </p>
                  <StatusBadge status={match.status} />
                </div>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center">
                  <div className="min-w-0 sm:text-right">
                    <p className="break-words text-base font-bold text-kasi-ink">{match.fixture.homeTeam.name}</p>
                    <p className="break-words text-sm text-kasi-muted">{match.fixture.homeTeam.club.name}</p>
                  </div>
                  <span className="text-xs font-bold uppercase text-kasi-muted">vs</span>
                  <div className="min-w-0 sm:text-left">
                    <p className="break-words text-base font-bold text-kasi-ink">{match.fixture.awayTeam.name}</p>
                    <p className="break-words text-sm text-kasi-muted">{match.fixture.awayTeam.club.name}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-kasi-border pt-3">
                  <p className="text-sm text-kasi-muted">
                    {formatDate(match.fixture.scheduled_date)} · {formatTime(match.fixture.kickoff_time)}
                    {match.fixture.ground ? ` · ${match.fixture.ground.name}` : ""}
                  </p>
                  <Link href={`/referee/matches/${match.id}`} className="btn-primary min-h-11">
                    Open match control
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}