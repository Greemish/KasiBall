"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/lib/api";
import type { PublicSeason } from "@/app/lib/season-context";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/Alert";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function LeaguesPage() {
  const [seasons, setSeasons] = useState<PublicSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    api.getPublicSeasons().then((result) => {
      if (!current) return;
      if (result.success) setSeasons(result.data as PublicSeason[]);
      else setError(result.error || "Unable to load public seasons.");
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, []);

  const activeSeason = seasons.find((season) => season.status === "ACTIVE");

  return (
    <>
      <PublicPageHeader
        eyebrow="Competition registry"
        title="South African grassroots leagues"
        description="Browse public KasiBall seasons and open the live competition table for an age group."
      />
      <Container>
        <div className="mx-auto max-w-4xl py-8">

        {error && <div className="mt-5"><Alert level="error">{error}</Alert></div>}

        {loading ? (
          <LoadingState />
        ) : seasons.length === 0 ? (
          <div className="mt-6 border border-dashed border-kasi-border bg-white px-5 py-10 text-center">
            <h2 className="font-semibold text-kasi-ink">No public seasons yet</h2>
            <p className="mt-2 text-base text-kasi-muted">Published competitions will appear here.</p>
          </div>
        ) : (
          <section className="mt-7" aria-labelledby="available-seasons">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-kasi-border pb-3">
              <h2 id="available-seasons" className="text-xl font-bold text-kasi-ink">Available seasons</h2>
              {activeSeason && <p className="text-sm text-kasi-muted">Current season: {activeSeason.name}</p>}
            </div>
            <ul className="divide-y divide-kasi-border border-b border-kasi-border">
              {seasons.map((season) => (
                <li key={season.id}>
                  <Link
                    href={`/leagues/${season.id}`}
                    className="grid gap-3 py-4 transition hover:text-kasi-green sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-semibold">{season.name}</span>
                      <span className="mt-1 block text-sm text-kasi-muted">
                        {formatDate(season.startDate)} - {formatDate(season.endDate)}
                      </span>
                    </span>
                    <StatusBadge status={season.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        </div>
      </Container>
    </>
  );
}