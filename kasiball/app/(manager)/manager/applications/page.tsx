"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { FormField } from "@/components/FormField";

type Application = {
  id: string;
  teamName: string;
  clubName: string | null;
  status: string;
  reviewNotes: string | null;
  ageGroup?: { id: string; name: string };
};

type Season = { id: string; name: string; status: string };
type AgeGroup = { id: string; name: string };

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // form
  const [form, setForm] = useState({
    teamName: "",
    clubName: "",
    ageGroupId: "",
    kitDescription: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadApps = async () => {
    const res = await api.getManagerTeamApplications();
    if (res.success) setApps(res.data as Application[]);
  };

  useEffect(() => {
    (async () => {
      await loadApps();
      const s = await api.getPublicSeasons();
      if (s.success) {
        setSeasons(s.data as Season[]);
        const first = (s.data as Season[])[0];
        if (first) setSeasonId(first.id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    (async () => {
      const res = await api.getPublicSeason(seasonId);
      if (res.success) {
        const ags = (res.data as { ageGroups?: AgeGroup[] }).ageGroups ?? [];
        setAgeGroups(ags);
        setForm((f) => ({ ...f, ageGroupId: ags[0]?.id ?? "" }));
      }
    })();
  }, [seasonId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await api.createManagerTeamApplication({
      teamName: form.teamName,
      clubName: form.clubName,
      ageGroupId: form.ageGroupId,
      kitDescription: form.kitDescription || undefined,
    });

    if (!res.success) {
      setError(res.error || "Failed to submit");
      setSubmitting(false);
      return;
    }

    setForm({ teamName: "", clubName: "", ageGroupId: "", kitDescription: "" });
    setShowForm(false);
    setSubmitting(false);
    await loadApps();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-kasi-green">Applications</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? "Cancel" : "New Application"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={submit} className="card mt-6 space-y-4">
          {error && <Alert level="error">{error}</Alert>}

          <FormField label="Club name" htmlFor="clubName">
            <input
              id="clubName"
              required
              value={form.clubName}
              onChange={(e) => setForm({ ...form, clubName: e.target.value })}
              className="form-input"
              placeholder="e.g. Pimville Pioneers FC"
            />
          </FormField>

          <FormField label="Team name" htmlFor="teamName">
            <input
              id="teamName"
              required
              value={form.teamName}
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
              className="form-input"
            />
          </FormField>

          <FormField label="Season" htmlFor="season">
            <select
              id="season"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="form-input"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Age group" htmlFor="ageGroup">
            <select
              id="ageGroup"
              value={form.ageGroupId}
              onChange={(e) => setForm({ ...form, ageGroupId: e.target.value })}
              className="form-input"
            >
              {ageGroups.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Kit description (optional)" htmlFor="kit">
            <input
              id="kit"
              value={form.kitDescription}
              onChange={(e) =>
                setForm({ ...form, kitDescription: e.target.value })
              }
              className="form-input"
              placeholder="e.g. Red and white stripes"
            />
          </FormField>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      )}

      {/* List */}
      {apps.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No applications yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {apps.map((a) => (
            <li key={a.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{a.teamName}</h3>
                  {a.clubName && (
                    <p className="text-sm text-kasi-muted">{a.clubName}</p>
                  )}
                  {a.ageGroup && (
                    <p className="mt-1 text-xs text-kasi-muted">
                      {a.ageGroup.name}
                    </p>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>

              {a.status === "CHANGES_REQUESTED" && a.reviewNotes && (
                <div className="mt-3">
                  <Alert level="warning" title="Changes requested">
                    {a.reviewNotes}
                  </Alert>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}