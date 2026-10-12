"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { FormField } from "@/components/FormField";

type Referee = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  licenseNumber: string | null;
  isActive: boolean;
  user?: { email: string };
};

export default function AdminRefereesPage() {
  const [refs, setRefs] = useState<Referee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    licenseNumber: "",
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminReferees();
    if (res.success) setRefs(res.data as Referee[]);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      licenseNumber: "",
      isActive: true,
    });
    setOpen(true);
  };

  const openEdit = (r: Referee) => {
    setEditId(r.id);
    setForm({
      email: r.user?.email ?? "",
      password: "",
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone ?? "",
      licenseNumber: r.licenseNumber ?? "",
      isActive: r.isActive,
    });
    setOpen(true);
  };

  const save = async () => {
    setError("");
    if (editId) {
      const res = await api.updateAdminReferee(editId, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        licenseNumber: form.licenseNumber || undefined,
        isActive: form.isActive,
      });
      if (!res.success) {
        setError(res.error || "Failed to save");
        return;
      }
    } else {
      const res = await api.createAdminReferee({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        licenseNumber: form.licenseNumber || undefined,
      });
      if (!res.success) {
        setError(res.error || "Failed to create");
        return;
      }
    }
    setOpen(false);
    await load();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-kasi-green">Referees</h1>
        <button onClick={openNew} className="btn-primary">New Referee</button>
      </div>

      {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

      {refs.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No referees yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>License</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.firstName} {r.lastName}</td>
                  <td className="text-sm">{r.user?.email ?? "—"}</td>
                  <td>{r.licenseNumber ?? "—"}</td>
                  <td>
                    <StatusBadge status={r.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td>
                    <button onClick={() => openEdit(r)} className="text-sm text-kasi-green hover:underline">
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
        title={editId ? "Edit referee" : "New referee"}
        onClose={() => setOpen(false)}
        actions={
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          {!editId && (
            <>
              <FormField label="Email" htmlFor="rEmail">
                <input id="rEmail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" />
              </FormField>
              <FormField label="Password" htmlFor="rPass">
                <input id="rPass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-input" />
              </FormField>
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First name" htmlFor="rFirst">
              <input id="rFirst" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="form-input" />
            </FormField>
            <FormField label="Last name" htmlFor="rLast">
              <input id="rLast" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="form-input" />
            </FormField>
          </div>
          <FormField label="Phone" htmlFor="rPhone">
            <input id="rPhone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" />
          </FormField>
          <FormField label="License number" htmlFor="rLic">
            <input id="rLic" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="form-input" />
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