"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";

type Row = {
  playerRegistrationId: string;
  name: string;
  starting: boolean;
  substitute: boolean;
  goalkeeper: boolean;
  shirtNumber: string;
};

export default function SquadPage() {
  const params = useParams<{ id: string }>();
  const matchId = params?.id;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    (async () => {
      const res = await api.getManagerMatchSquad(matchId);
      if (res.success) {
        const data = res.data as unknown[];
        setRows(
          (data as { playerRegistrationId: string; starting: boolean; substitute: boolean; goalkeeper: boolean; shirtNumber: number | null; playerRegistration?: { player?: { firstName: string; lastName: string } } }[]).map(
            (s) => ({
              playerRegistrationId: s.playerRegistrationId,
              name: s.playerRegistration?.player
                ? `${s.playerRegistration.player.firstName} ${s.playerRegistration.player.lastName}`
                : s.playerRegistrationId,
              starting: s.starting,
              substitute: s.substitute,
              goalkeeper: s.goalkeeper,
              shirtNumber: s.shirtNumber?.toString() ?? "",
            })
          )
        );
      }
      setLoading(false);
    })();
  }, [matchId]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((r) => r.map((row) => (row.playerRegistrationId === id ? { ...row, ...patch } : row)));

  const save = async () => {
    if (!matchId) return;
    setError("");
    setSaved(false);
    setSaving(true);

    const res = await api.setManagerMatchSquad(matchId, {
      players: rows.map((r) => ({
        playerRegistrationId: r.playerRegistrationId,
        starting: r.starting,
        substitute: r.substitute,
        goalkeeper: r.goalkeeper,
        shirtNumber: r.shirtNumber ? Number(r.shirtNumber) : null,
      })),
    });

    if (!res.success) setError(res.error || "Failed to save");
    else setSaved(true);
    setSaving(false);
  };

  if (loading) return <LoadingState />;

  if (rows.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-kasi-green">Matchday Squad</h1>
        <p className="mt-4 text-sm text-kasi-muted">
          No registered players for this match yet. Register and verify players first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-kasi-green">Matchday Squad</h1>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save Squad"}
        </button>
      </div>

      {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}
      {saved && <div className="mt-4"><Alert level="success">Squad saved.</Alert></div>}

      <div className="mt-6 overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Player</th>
              <th>#</th>
              <th>Starting</th>
              <th>Sub</th>
              <th>GK</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.playerRegistrationId}>
                <td className="font-medium">{r.name}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={r.shirtNumber}
                    onChange={(e) => update(r.playerRegistrationId, { shirtNumber: e.target.value })}
                    className="form-input w-20"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={r.starting}
                    onChange={(e) => update(r.playerRegistrationId, { starting: e.target.checked, substitute: e.target.checked ? false : r.substitute })}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={r.substitute}
                    onChange={(e) => update(r.playerRegistrationId, { substitute: e.target.checked, starting: e.target.checked ? false : r.starting })}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={r.goalkeeper}
                    onChange={(e) => update(r.playerRegistrationId, { goalkeeper: e.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}