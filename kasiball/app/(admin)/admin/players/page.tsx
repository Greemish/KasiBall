"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { FormField } from "@/components/FormField";

type Registration = {
  id: string;
  registrationStatus: string;
  shirtNumber: number | null;
  reviewNotes: string | null;
  player: { firstName: string; lastName: string; dateOfBirth: string };
  team: { id: string; name: string; club?: { name: string } };
  season: { id: string; name: string };
};

const TABS = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CHANGES_REQUESTED", label: "Changes Requested" },
  { key: "VERIFIED", label: "Verified" },
  { key: "REJECTED", label: "Rejected" },
];

function age(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export default function AdminPlayersPage() {
  const [tab, setTab] = useState("");
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [modalId, setModalId] = useState<string | null>(null);
  const [action, setAction] = useState<"CHANGES_REQUESTED" | "REJECTED" | null>(null);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminPlayerRegistrations(
      tab ? { status: tab } : undefined
    );
    if (res.success) setRows(res.data as Registration[]);
    else setError(res.error);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async (id: string) => {
    setBusyId(id);
    setError("");
    const res = await api.verifyAdminPlayerRegistration(id);
    if (!res.success) setError(res.error || "Failed");
    setBusyId(null);
    await load();
  };

  const submitReview = async () => {
    if (!modalId || !action) return;
    setBusyId(modalId);
    setError("");
    const res =
      action === "REJECTED"
        ? await api.rejectAdminPlayerRegistration(modalId, notes)
        : await api.requestChangesAdminPlayerRegistration(modalId, notes);
    if (!res.success) setError(res.error || "Failed");
    setModalId(null);
    setAction(null);
    setNotes("");
    setBusyId(null);
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-kasi-green">Player Registrations</h1>

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
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No registrations.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Player</th>
                <th>Age</th>
                <th>Team</th>
                <th>Club</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pending = r.registrationStatus === "PENDING" || r.registrationStatus === "CHANGES_REQUESTED";
                return (
                  <tr key={r.id}>
                    <td className="font-medium">
                      {r.player.firstName} {r.player.lastName}
                    </td>
                    <td>{age(r.player.dateOfBirth)}</td>
                    <td>{r.team.name}</td>
                    <td>{r.team.club?.name ?? "—"}</td>
                    <td><StatusBadge status={r.registrationStatus} /></td>
                    <td>
                      {pending && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => verify(r.id)}
                            disabled={busyId === r.id}
                            className="text-sm font-medium text-green-700 hover:underline"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => { setModalId(r.id); setAction("CHANGES_REQUESTED"); }}
                            className="text-sm text-amber-700 hover:underline"
                          >
                            Changes
                          </button>
                          <button
                            onClick={() => { setModalId(r.id); setAction("REJECTED"); }}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modalId}
        title={action === "REJECTED" ? "Reject registration" : "Request changes"}
        onClose={() => { setModalId(null); setAction(null); }}
        actions={
          <>
            <button onClick={() => { setModalId(null); setAction(null); }} className="btn-ghost">Cancel</button>
            <button onClick={submitReview} className={action === "REJECTED" ? "btn-danger" : "btn-primary"}>Confirm</button>
          </>
        }
      >
        <FormField label="Notes" htmlFor="notes">
          <textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" />
        </FormField>
      </Modal>
    </div>
  );
}