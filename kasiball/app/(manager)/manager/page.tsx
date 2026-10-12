"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";

type Team = { id: string; name: string; ageGroup?: { name: string } };
type Application = { id: string; teamName: string; status: string };
type PlayerReg = { id: string; registrationStatus: string };

export default function ManagerDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [players, setPlayers] = useState<PlayerReg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, a, p] = await Promise.all([
        api.getManagerTeams(),
        api.getManagerTeamApplications(),
        api.getManagerPlayers(),
      ]);
      if (t.success) setTeams(t.data as Team[]);
      if (a.success) setApplications(a.data as Application[]);
      if (p.success) setPlayers(p.data as PlayerReg[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState />;

  const verified = players.filter(
    (p) => p.registrationStatus === "VERIFIED"
  ).length;
  const pending = players.filter(
    (p) => p.registrationStatus === "PENDING"
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-kasi-green">Dashboard</h1>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Teams" value={teams.length} />
        <Stat label="Players" value={players.length} />
        <Stat label="Verified" value={verified} />
        <Stat label="Pending" value={pending} />
      </div>

      {/* Teams */}
      <h2 className="mt-10 text-xl font-bold text-kasi-green">My Teams</h2>
      {teams.length === 0 ? (
        <p className="mt-3 text-sm text-kasi-muted">No teams yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {teams.map((t) => (
            <li key={t.id} className="card flex items-center justify-between">
              <span className="font-medium">{t.name}</span>
              {t.ageGroup && <span className="badge-info">{t.ageGroup.name}</span>}
            </li>
          ))}
        </ul>
      )}

      {/* Applications */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-bold text-kasi-green">Applications</h2>
        <Link href="/manager/applications" className="text-sm font-medium text-kasi-green hover:underline">
          View all →
        </Link>
      </div>
      {applications.length === 0 ? (
        <p className="mt-3 text-sm text-kasi-muted">
          No applications yet.{" "}
          <Link href="/manager/applications" className="text-kasi-green hover:underline">
            Apply for a team
          </Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {applications.slice(0, 5).map((a) => (
            <li key={a.id} className="card flex items-center justify-between">
              <span className="font-medium">{a.teamName}</span>
              <StatusBadge status={a.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-bold text-kasi-green">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-kasi-muted">
        {label}
      </div>
    </div>
  );
}