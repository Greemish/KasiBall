"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";

type Match = {
  id: string;
  homeScore: number;
  awayScore: number;
  status: string;
  fixture: {
    homeTeam: { name: string };
    awayTeam: { name: string };
    scheduled_date: string | null;
    ageGroup?: { name: string };
  };
};

const TABS = [
  { key: "", label: "All" },
  { key: "NOT_STARTED", label: "Upcoming" },
  { key: "IN_PROGRESS", label: "Live" },
  { key: "COMPLETED", label: "Completed" },
];

export default function AdminMatchesPage() {
  const [tab, setTab] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminMatches(tab ? { status: tab } : undefined);
    if (res.success) setMatches(res.data as Match[]);
    else setError(res.error);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const reopen = async (id: string) => {
    setBusyId(id);
    setError("");
    const res = await api.reopenAdminMatch(id);
    if (!res.success) setError(res.error || "Failed to reopen");
    setBusyId(null);
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-kasi-green">Matches</h1>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-kasi-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-b-2 border-kasi-green text-kasi-green"
                : "text-kasi-muted hover:text-kasi-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

      {loading ? (
        <LoadingState />
      ) : matches.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No matches.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>Home</th>
                <th>Score</th>
                <th>Away</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td className="text-sm">
                    {m.fixture.scheduled_date
                      ? new Date(m.fixture.scheduled_date).toLocaleDateString("en-ZA")
                      : "—"}
                  </td>
                  <td className="font-medium">{m.fixture.homeTeam.name}</td>
                  <td className="text-center font-bold">
                    {m.status === "NOT_STARTED"
                      ? "vs"
                      : `${m.homeScore}–${m.awayScore}`}
                  </td>
                  <td className="font-medium">{m.fixture.awayTeam.name}</td>
                  <td><StatusBadge status={m.status} /></td>
                  <td>
                    {m.status === "COMPLETED" && (
                      <button
                        onClick={() => reopen(m.id)}
                        disabled={busyId === m.id}
                        className="text-sm text-amber-700 hover:underline"
                      >
                        Reopen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}