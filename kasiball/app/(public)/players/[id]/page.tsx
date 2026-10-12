"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/app/lib/api";
import { Container } from "@/components/layout/Container";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";

type StatBlock = {
  matches: number;
  starts: number;
  subApps: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
};

type SeasonStat = StatBlock & { seasonId: string; seasonName: string };

type Player = {
  playerId: string;
  name: string;
  age: number;
  photoUrl: string | null;
  totals: StatBlock;
  bySeason: SeasonStat[];
};

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-kasi-border bg-white p-4 text-center">
      <div className="text-2xl font-bold text-kasi-green">{value}</div>
      <div className="mt-1 text-sm text-kasi-muted">
        {label}
      </div>
    </div>
  );
}

export default function PlayerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await api.getPublicPlayer(id);
      if (res.success) setPlayer(res.data as Player);
      else setError(res.error);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <Container>
        <div className="py-8">
          <LoadingState />
        </div>
      </Container>
    );
  }

  if (error || !player) {
    return (
      <Container>
        <div className="py-8">
          <Alert level="error">{error || "Player not found"}</Alert>
        </div>
      </Container>
    );
  }

  const t = player.totals;

  return (
    <>
      <Container>
        <nav aria-label="Breadcrumb" className="py-4 text-sm">
          <Link href="/players" className="font-medium text-kasi-green underline underline-offset-4">
            Players directory
          </Link>
          <span className="px-2 text-kasi-muted">/</span>
          <span className="text-kasi-muted">Player profile</span>
        </nav>
      </Container>
      <PublicPageHeader
        eyebrow="KasiBall talent profile"
        title={player.name}
        description={`Age ${player.age} · Public football statistics`}
      />
      <Container>
        <div className="py-8">
          <div className="mb-6 flex items-center gap-4 border-b border-kasi-border bg-white p-4">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={`Profile of ${player.name}`}
              width={80}
              height={80}
              className="h-20 w-20 border border-kasi-border object-cover"
            />
          ) : (
            <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center border-l-4 border-kasi-gold bg-kasi-green text-2xl font-bold text-white">
              {player.name.charAt(0)}
            </span>
          )}
          <p className="text-sm text-kasi-muted">Verified player record</p>
          </div>

        <section className="mt-7" aria-labelledby="player-statistics">
          <h2 id="player-statistics" className="text-xl font-bold text-kasi-green">
            Career statistics
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Matches" value={t.matches} />
          <StatBox label="Starts" value={t.starts} />
          <StatBox label="Goals" value={t.goals} />
          <StatBox label="Assists" value={t.assists} />
          <StatBox label="Yellow" value={t.yellowCards} />
          <StatBox label="Red" value={t.redCards} />
          <StatBox label="Clean Sheets" value={t.cleanSheets} />
          <StatBox label="Sub Apps" value={t.subApps} />
          </div>
        </section>

        {player.bySeason.length > 0 && (
          <section className="mt-9" aria-labelledby="season-statistics">
            <h2 id="season-statistics" className="text-xl font-bold text-kasi-green">
              Statistics by season
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th scope="col">Season</th>
                    <th scope="col">P</th>
                    <th scope="col">Goals</th>
                    <th scope="col">Assists</th>
                    <th scope="col">Yellow</th>
                    <th scope="col">Red</th>
                    <th scope="col">Clean sheets</th>
                  </tr>
                </thead>
                <tbody>
                  {player.bySeason.map((s) => (
                    <tr key={s.seasonId}>
                      <td>{s.seasonName}</td>
                      <td>{s.matches}</td>
                      <td className="font-semibold">{s.goals}</td>
                      <td>{s.assists}</td>
                      <td>{s.yellowCards}</td>
                      <td>{s.redCards}</td>
                      <td>{s.cleanSheets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {player.bySeason.length === 0 && (
          <p className="mt-8 text-base text-kasi-muted">
            No match data available yet.
          </p>
        )}

        <section className="mt-9 border-l-4 border-kasi-gold bg-kasi-surface p-5" aria-labelledby="youth-privacy">
          <h2 id="youth-privacy" className="text-lg font-bold text-kasi-ink">
            Youth safeguarding &amp; privacy
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-kasi-muted">
            This profile shows football statistics only. Identity documents, birth dates, addresses, phone numbers, school details and guardian contacts are not displayed here.
          </p>
        </section>
        </div>
      </Container>
    </>
  );
}