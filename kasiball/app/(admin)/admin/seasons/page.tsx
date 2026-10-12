"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";

type Season = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  cancellationReason?: string | null;
};

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  // cancel modal
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const load = async () => {
    const res = await api.getAdminSeasons();
    if (res.success) setSeasons(res.data as Season[]);
  };

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await api.createAdminSeason(form);
    if (!res.success) {
      setError(res.error || "Failed to create season");
      setSubmitting(false);
      return;
    }
    setForm({ name: "", startDate: "", endDate: "" });
    setShowForm(false);
    setSubmitting(false);
    await load();
  };

  const cancelSeason = async () => {
    if (!cancelId) return;
    const res = await api.updateAdminSeason(cancelId, {
      status: "CANCELLED",
      cancellationReason: cancelReason,
    });
    if (!res.success) {
      setError(res.error || "Failed to cancel");
      return;
    }
    setCancelId(null);
    setCancelReason("");
    await load();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-kasi-green">Seasons</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? "Cancel" : "New Season"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="card mt-6 space-y-4">
          {error && <Alert level="error">{error}</Alert>}
          <FormField label="Season name" htmlFor="name">
            <input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-input"
              placeholder="e.g. 2026 Development Season"
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date" htmlFor="start">
              <input
                id="start"
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="form-input"
              />
            </FormField>
            <FormField label="End date" htmlFor="end">
              <input
                id="end"
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="form-input"
              />
            </FormField>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Creating…" : "Create Season"}
          </button>
        </form>
      )}

      {seasons.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No seasons yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dates</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">
                    <Link
                      href={`/admin/seasons/${s.id}`}
                      className="hover:text-kasi-green hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="text-sm text-kasi-muted">
                    {new Date(s.startDate).toLocaleDateString("en-ZA")} –{" "}
                    {new Date(s.endDate).toLocaleDateString("en-ZA")}
                  </td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    {s.status !== "CANCELLED" && s.status !== "COMPLETED" && (
                      <button
                        onClick={() => setCancelId(s.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!cancelId}
        title="Cancel season"
        onClose={() => setCancelId(null)}
        actions={
          <>
            <button onClick={() => setCancelId(null)} className="btn-ghost">
              Close
            </button>
            <button onClick={cancelSeason} className="btn-danger">
              Cancel Season
            </button>
          </>
        }
      >
        <FormField label="Reason for cancellation" htmlFor="reason">
          <textarea
            id="reason"
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="form-input"
            placeholder="e.g. Insufficient team registrations"
          />
        </FormField>
      </Modal>
    </div>
  );
}