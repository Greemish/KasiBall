"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/app/lib/api";
import { getDefaultSeason, type PublicSeason } from "@/app/lib/season-context";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";

type SearchResult = {
  playerId: string;
  name: string;
  age: number;
  team: { id: string; name: string; club: { id: string; name: string } } | null;
};

type LeaderRow = {
  playerId: string;
  playerName: string;
  teamName: string;
  goals: number;
  assists: number;
  appearances: number;
};

function PlayersInner() {
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";

  const [q, setQ] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [seasons, setSeasons] = useState<PublicSeason[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load leaderboard on mount
  useEffect(() => {
    (async () => {
      const all = await api.getPublicSeasons();
      if (!all.success) return;
      setSeasons(all.data as PublicSeason[]);
      const def = await getDefaultSeason();
      if (!def) return;

      const res = await api.getPublicLeaderboard(def.id, {
        sortBy: "goals",
        limit: "20",
      });
      if (res.success) setLeaders(res.data as LeaderRow[]);
    })();
  }, []);

  // Run search when q changes (debounced-ish, 2-char minimum)
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await api.searchPublicPlayers(q.trim());
      if (res.success) setResults(res.data as SearchResult[]);
      setSearched(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <PublicPageHeader
        eyebrow="Kasi footballers directory"
        title="Verifiably logged South African grassroots footballers"
        description="Search public player records by name. Only verified registrations are included in search results."
      />
      <Container>
        <div className="py-8">

        <div className="mt-6 max-w-xl">
          <label htmlFor="player-search" className="form-label">Player name</label>
          <input
            id="player-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Enter at least two characters"
            minLength={2}
            className="form-input mt-1 min-h-11 text-base"
          />
        </div>

        {q.trim().length >= 2 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-kasi-ink">Search results</h2>
            {loading ? (
              <LoadingState />
            ) : results.length === 0 && searched ? (
              <p className="mt-3 text-base text-kasi-muted">
                No players found for “{q}”.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-kasi-border border-y border-kasi-border">
                {results.map((p) => (
                  <li key={p.playerId}>
                    <Link
                      href={`/players/${p.playerId}`}
                      className="flex flex-col gap-2 py-4 transition hover:text-kasi-green sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-base font-semibold">{p.name}</span>
                      <span className="text-sm text-kasi-muted sm:text-right">
                        {p.team
                          ? `${p.team.name} · ${p.team.club.name}`
                          : "No team"}{" "}
                        · age {p.age}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <section className="mt-10" aria-labelledby="goals-leaderboard">
          <div className="border-b border-kasi-border pb-3">
            <p className="eyebrow">Season statistics</p>
            <h2 id="goals-leaderboard" className="mt-1 text-xl font-bold text-kasi-green sm:text-2xl">
              Goals leaderboard
            </h2>
          </div>
          {leaders.length === 0 ? (
            <p className="mt-3 text-base text-kasi-muted">
              No scoring data yet.
            </p>
          ) : (
            <ol className="divide-y divide-kasi-border border-b border-kasi-border">
              {leaders.map((r, i) => (
                <li
                  key={r.playerId}
                  className="flex flex-wrap items-center gap-3 py-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-kasi-gold text-sm font-bold text-kasi-ink">
                    {i + 1}
                  </span>
                  <Link
                    href={`/players/${r.playerId}`}
                    className="min-w-[9rem] flex-1 text-base font-semibold hover:text-kasi-green"
                  >
                    {r.playerName}
                  </Link>
                  <span className="min-w-0 flex-1 text-sm text-kasi-muted sm:flex-none">{r.teamName}</span>
                  <span className="text-right text-sm font-bold text-kasi-green">{r.goals} goals</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        </div>
      </Container>
    </>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PlayersInner />
    </Suspense>
  );
}