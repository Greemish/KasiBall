"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { FormField } from "@/components/FormField";

type Club = {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  _count?: { teams: number; managers: number };
};

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", shortName: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminClubs();
    if (res.success) setClubs(res.data as Club[]);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", shortName: "" });
    setOpen(true);
  };

  const openEdit = (c: Club) => {
    setEditId(c.id);
    setForm({ name: c.name, shortName: c.shortName ?? "" });
    setOpen(true);
  };

  const save = async () => {
    setError("");
    const res = editId
      ? await api.updateAdminClub(editId, {
          name: form.name,
          shortName: form.shortName || undefined,
        })
      : await api.createAdminClub({
          name: form.name,
          shortName: form.shortName || undefined,
        });

    if (!res.success) {
      setError(res.error || "Failed to save");
      return;
    }
    setOpen(false);
    await load();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-kasi-green">Clubs</h1>
        <button onClick={openNew} className="btn-primary">New Club</button>
      </div>

      {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

      {clubs.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No clubs yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Short</th>
                <th>Teams</th>
                <th>Managers</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.shortName ?? "—"}</td>
                  <td>{c._count?.teams ?? 0}</td>
                  <td>{c._count?.managers ?? 0}</td>
                  <td>
                    <button onClick={() => openEdit(c)} className="text-sm text-kasi-green hover:underline">
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
        open={open}
        title={editId ? "Edit club" : "New club"}
        onClose={() => setOpen(false)}
        actions={
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" htmlFor="cName">
            <input id="cName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" />
          </FormField>
          <FormField label="Short name" htmlFor="cShort">
            <input id="cShort" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} className="form-input" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}