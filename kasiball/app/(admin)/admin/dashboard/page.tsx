"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { Alert } from "@/components/Alert";
import { LoadingState } from "@/components/LoadingState";

type DashboardStats = {
  seasons: number | null;
  clubs: number | null;
  teams: number | null;
  applications: number | null;
  pendingPlayers: number | null;
  pendingDocuments: number | null;
  completedMatches: number | null;
  grounds: number | null;
  referees: number | null;
};

const EMPTY_STATS: DashboardStats = {
  seasons: null,
  clubs: null,
  teams: null,
  applications: null,
  pendingPlayers: null,
  pendingDocuments: null,
  completedMatches: null,
  grounds: null,
  referees: null,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, c, t, a, p, d, m, g, r] = await Promise.all([
        api.getAdminSeasons(),
        api.getAdminClubs(),
        api.getAdminTeams(),
        api.getAdminTeamApplications(),
        api.getAdminPlayerRegistrations({ status: "PENDING" }),
        api.getAdminPlayerDocuments({ status: "PENDING" }),
        api.getAdminMatches({ status: "COMPLETED" }),
        api.getAdminGrounds(),
        api.getAdminReferees(),
      ]);

      const count = (result: { success: boolean; data?: unknown }) =>
        result.success && Array.isArray(result.data) ? result.data.length : null;
      const results = [s, c, t, a, p, d, m, g, r];
      setHasLoadError(results.some((result) => !result.success));

      const seasons = s.success
        ? (s.data as { name: string; status: string }[])
        : [];
      setActiveSeason(
        s.success
          ? seasons.find((season) => season.status === "ACTIVE")?.name ?? ""
          : null
      );
      setStats({
        seasons: count(s),
        clubs: count(c),
        teams: count(t),
        applications: a.success
          ? (a.data as { status: string }[]).filter(
              (x) => x.status === "PENDING"
            ).length
          : null,
        pendingPlayers: count(p),
        pendingDocuments: count(d),
        completedMatches: count(m),
        grounds: count(g),
        referees: count(r),
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState />;

  const cards = [
    { label: "Seasons", value: stats.seasons, href: "/admin/seasons" },
    { label: "Clubs", value: stats.clubs, href: "/admin/clubs" },
    { label: "Teams", value: stats.teams, href: "/admin/teams" },
    {
      label: "Pending applications",
      value: stats.applications,
      href: "/admin/team-applications",
      highlight: (stats.applications ?? 0) > 0,
    },
    {
      label: "Pending player registrations",
      value: stats.pendingPlayers,
      href: "/admin/players?status=PENDING",
      highlight: (stats.pendingPlayers ?? 0) > 0,
    },
    {
      label: "Pending document reviews",
      value: stats.pendingDocuments,
      href: "/admin/verification",
      highlight: (stats.pendingDocuments ?? 0) > 0,
    },
    { label: "Completed matches", value: stats.completedMatches, href: "/admin/matches" },
    { label: "Grounds", value: stats.grounds, href: "/admin/grounds" },
    { label: "Referees", value: stats.referees, href: "/admin/referees" },
  ];

  return (
    <div>
      <div className="border-b border-kasi-border pb-5">
        <p className="eyebrow">System operations</p>
        <h1 className="mt-1 text-2xl font-bold text-kasi-green">Operations dashboard</h1>
        <p className="mt-2 text-base text-kasi-muted">
          Current season: {activeSeason === null ? "Unavailable" : activeSeason || "No active season"}
        </p>
      </div>

      {hasLoadError && (
        <div className="mt-5">
          <Alert level="warning" title="Some operational data could not be loaded">
            Unavailable counts are shown as a dash. Other loaded data remains available.
          </Alert>
        </div>
      )}

      {!loading && (
        <section className="mt-6 border-l-4 border-kasi-gold bg-white px-5 py-4" aria-labelledby="critical-alerts">
          <h2 id="critical-alerts" className="text-base font-bold text-kasi-ink">Critical alerts</h2>
          <div className="mt-2 space-y-1 text-sm text-kasi-muted">
            {(stats.applications ?? 0) > 0 && (
              <p><Link href="/admin/team-applications" className="font-semibold text-kasi-green underline">{stats.applications} team applications</Link> are awaiting review.</p>
            )}
            {(stats.pendingDocuments ?? 0) > 0 && (
              <p><Link href="/admin/verification" className="font-semibold text-kasi-green underline">{stats.pendingDocuments} player documents</Link> are awaiting verification.</p>
            )}
            {stats.applications === 0 && stats.pendingDocuments === 0 && (
              <p>No pending application or document reviews.</p>
            )}
          </div>
        </section>
      )}

      <section className="mt-7" aria-labelledby="registry-overview">
        <h2 id="registry-overview" className="text-lg font-bold text-kasi-ink">Registry overview</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`card text-left transition hover:border-kasi-green ${
              c.highlight ? "border-kasi-gold" : ""
            }`}
          >
            <div className="text-3xl font-bold text-kasi-green">
              {loading ? "-" : c.value ?? "-"}
            </div>
            <div className="mt-2 text-sm font-medium text-kasi-muted">{c.label}</div>
          </Link>
        ))}
        </div>
      </section>

      <section className="mt-7 border-t border-kasi-border pt-5" aria-labelledby="direct-actions">
        <h2 id="direct-actions" className="text-lg font-bold text-kasi-ink">Direct actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/verification" className="btn-primary min-h-11">Review player documents</Link>
          <Link href="/admin/team-applications" className="btn-secondary min-h-11">Review team applications</Link>
          <Link href="/admin/matches" className="btn-secondary min-h-11">Open match operations</Link>
        </div>
      </section>
    </div>
  );
}