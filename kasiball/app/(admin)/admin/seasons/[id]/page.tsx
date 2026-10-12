"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { FormField } from "@/components/FormField";

type AgeGroup = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
};

type Season = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  ageGroups?: AgeGroup[];
};

export default function SeasonDetailPage() {
  const params = useParams<{ id: string }>();
  const seasonId = params?.id;

  const [season, setSeason] = useState<Season | null>(null);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name: "", maxAge: "", minAge: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!seasonId) return;
    const [s, ag] = await Promise.all([
      api.getAdminSeason(seasonId),
      api.getAdminAgeGroups(seasonId),
    ]);
    if (s.success) setSeason(s.data as Season);
    if (ag.success) setAgeGroups(ag.data as AgeGroup[]);
    setLoading(false);
  }, [seasonId]);

  useEffect(() => {
    load();
  }, [load]);

  const addAgeGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonId) return;
    setError("");
    setSubmitting(true);

    const res = await api.createAdminAgeGroup(seasonId, {
      name: form.name,
      maxAge: Number(form.maxAge),
      minAge: form.minAge ? Number(form.minAge) : undefined,
    });

    if (!res.success) {
      setError(res.error || "Failed to add age group");
      setSubmitting(false);
      return;
    }
    setForm({ name: "", maxAge: "", minAge: "" });
    setSubmitting(false);
    await load();
  };

  if (loading) return <LoadingState />;
  if (!season) return <Alert level="error">Season not found</Alert>;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-kasi-green">{season.name}</h1>
        <StatusBadge status={season.status} />
      </div>
      <p className="mt-1 text-sm text-kasi-muted">
        {new Date(season.startDate).toLocaleDateString("en-ZA")} –{" "}
        {new Date(season.endDate).toLocaleDateString("en-ZA")}
      </p>

      <h2 className="mt-10 text-xl font-bold text-kasi-green">Age Groups</h2>

      <form onSubmit={addAgeGroup} className="card mt-4 space-y-4">
        {error && <Alert level="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Name" htmlFor="agName">
            <input
              id="agName"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-input"
              placeholder="e.g. U13"
            />
          </FormField>
          <FormField label="Max age" htmlFor="agMax">
            <input
              id="agMax"
              type="number"
              required
              value={form.maxAge}
              onChange={(e) => setForm({ ...form, maxAge: e.target.value })}
              className="form-input"
              placeholder="13"
            />
          </FormField>
          <FormField label="Min age (optional)" htmlFor="agMin">
            <input
              id="agMin"
              type="number"
              value={form.minAge}
              onChange={(e) => setForm({ ...form, minAge: e.target.value })}
              className="form-input"
            />
          </FormField>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Adding…" : "Add Age Group"}
        </button>
      </form>

      {ageGroups.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No age groups yet.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {ageGroups.map((a) => (
            <li key={a.id} className="card flex items-center justify-between">
              <span className="font-medium">{a.name}</span>
              <span className="text-sm text-kasi-muted">
                {a.minAge ?? "—"}–{a.maxAge ?? "—"} years
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}