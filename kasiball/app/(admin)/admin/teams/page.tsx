"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { FormField } from "@/components/FormField";

type Team = {
  id: string;
  name: string;
  shortName: string | null;
  status: string;
  club?: { id: string; name: string };
  ageGroup?: { id: string; name: string };
  manager?: { id: string; firstName: string; lastName: string };
};

const STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "INACTIVE",
];

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", shortName: "", status: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminTeams();
    if (res.success) setTeams(res.data as Team[]);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (t: Team) => {
    setEditId(t.id);
    setForm({ name: t.name, shortName: t.shortName ?? "", status: t.status });
  };

  const save = async () => {
    if (!editId) return;
    const res = await api.updateAdminTeam(editId, {
      name: form.name,
      shortName: form.shortName || undefined,
      status: form.status,
    });
    if (!res.success) {
      setError(res.error || "Failed to update");
      return;
    }
    setEditId(null);
    await load();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-kasi-green">Teams</h1>
      {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

      {teams.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No teams yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Team</th>
                <th>Club</th>
                <th>Age Group</th>
                <th>Manager</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.name}</td>
                  <td>{t.club?.name ?? "—"}</td>
                  <td>{t.ageGroup?.name ?? "—"}</td>
                  <td>
                    {t.manager
                      ? `${t.manager.firstName} ${t.manager.lastName}`
                      : "—"}
                  </td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <button
                      onClick={() => openEdit(t)}
                      className="text-sm text-kasi-green hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!editId}
        title="Edit team"
        onClose={() => setEditId(null)}
        actions={
          <>
            <button onClick={() => setEditId(null)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" htmlFor="tName">
            <input id="tName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" />
          </FormField>
          <FormField label="Short name" htmlFor="tShort">
            <input id="tShort" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} className="form-input" />
          </FormField>
          <FormField label="Status" htmlFor="tStatus">
            <select id="tStatus" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}