"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { FormField } from "@/components/FormField";

type Ground = {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  capacity: number | null;
  isActive: boolean;
};

export default function AdminGroundsPage() {
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    address: "",
    capacity: "",
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminGrounds();
    if (res.success) setGrounds(res.data as Ground[]);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", location: "", address: "", capacity: "", isActive: true });
    setOpen(true);
  };

  const openEdit = (g: Ground) => {
    setEditId(g.id);
    setForm({
      name: g.name,
      location: g.location ?? "",
      address: g.address ?? "",
      capacity: g.capacity ? String(g.capacity) : "",
      isActive: g.isActive,
    });
    setOpen(true);
  };

  const save = async () => {
    setError("");
    const body = {
      name: form.name,
      location: form.location || undefined,
      address: form.address || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      isActive: form.isActive,
    };
    const res = editId
      ? await api.updateAdminGround(editId, body)
      : await api.createAdminGround(body);

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
        <h1 className="text-2xl font-bold text-kasi-green">Grounds</h1>
        <button onClick={openNew} className="btn-primary">New Ground</button>
      </div>

      {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

      {grounds.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No grounds yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {grounds.map((g) => (
                <tr key={g.id}>
                  <td className="font-medium">{g.name}</td>
                  <td>{g.location ?? "—"}</td>
                  <td>{g.capacity ?? "—"}</td>
                  <td>
                    <StatusBadge status={g.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td>
                    <button onClick={() => openEdit(g)} className="text-sm text-kasi-green hover:underline">
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
        title={editId ? "Edit ground" : "New ground"}
        onClose={() => setOpen(false)}
        actions={
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" htmlFor="gName">
            <input id="gName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" />
          </FormField>
          <FormField label="Location" htmlFor="gLoc">
            <input id="gLoc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="form-input" />
          </FormField>
          <FormField label="Address" htmlFor="gAddr">
            <input id="gAddr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-input" />
          </FormField>
          <FormField label="Capacity" htmlFor="gCap">
            <input id="gCap" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="form-input" />
          </FormField>
          {editId && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
}