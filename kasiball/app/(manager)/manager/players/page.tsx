"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { FormField } from "@/components/FormField";

type Registration = {
  id: string;
  registrationStatus: string;
  reviewNotes: string | null;
  shirtNumber: number | null;
  player: { firstName: string; lastName: string };
  team: { id: string; name: string };
  season: { id: string; name: string };
};

type Team = { id: string; name: string };

export default function ManagerPlayersPage() {
  const [players, setPlayers] = useState<Registration[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    saIdNumber: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    teamId: "",
    seasonId: "",
    shirtNumber: "",
  });

  const load = async () => {
    const res = await api.getManagerPlayers();
    if (res.success) setPlayers(res.data as Registration[]);
  };

  useEffect(() => {
    (async () => {
      await load();
      const t = await api.getManagerTeams();
      if (t.success) {
        const list = t.data as Team[];
        setTeams(list);
        if (list[0]) setForm((f) => ({ ...f, teamId: list[0].id }));
      }
      const s = await api.getPublicSeasons();
      if (s.success) {
        const list = s.data as { id: string }[];
        if (list[0]) setForm((f) => ({ ...f, seasonId: list[0].id }));
      }
      setLoading(false);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await api.createManagerPlayer({
      saIdNumber: form.saIdNumber,
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth,
      teamId: form.teamId,
      seasonId: form.seasonId,
      shirtNumber: form.shirtNumber ? Number(form.shirtNumber) : undefined,
    });

    if (!res.success) {
      setError(res.error || "Failed to register player");
      setSubmitting(false);
      return;
    }

    setForm({
      saIdNumber: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      teamId: teams[0]?.id ?? "",
      seasonId: form.seasonId,
      shirtNumber: "",
    });
    setShowForm(false);
    setSubmitting(false);
    await load();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-kasi-green">Players</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? "Cancel" : "Register Player"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mt-6 space-y-4">
          {error && <Alert level="error">{error}</Alert>}

          <FormField label="SA ID number" htmlFor="saId">
            <input
              id="saId"
              required
              value={form.saIdNumber}
              onChange={(e) => setForm({ ...form, saIdNumber: e.target.value })}
              className="form-input"
              placeholder="13 digits"
              maxLength={13}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First name" htmlFor="firstName">
              <input
                id="firstName"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="form-input"
              />
            </FormField>
            <FormField label="Last name" htmlFor="lastName">
              <input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="form-input"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date of birth" htmlFor="dob">
              <input
                id="dob"
                type="date"
                required
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="form-input"
              />
            </FormField>
            <FormField label="Shirt number (optional)" htmlFor="shirt">
              <input
                id="shirt"
                type="number"
                min={1}
                max={99}
                value={form.shirtNumber}
                onChange={(e) => setForm({ ...form, shirtNumber: e.target.value })}
                className="form-input"
              />
            </FormField>
          </div>

          <FormField label="Team" htmlFor="team">
            <select
              id="team"
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              className="form-input"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Registering…" : "Register Player"}
          </button>
        </form>
      )}

      {players.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No players registered yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>#</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">
                    {p.player.firstName} {p.player.lastName}
                  </td>
                  <td>{p.team.name}</td>
                  <td>{p.shirtNumber ?? "—"}</td>
                  <td><StatusBadge status={p.registrationStatus} /></td>
                  <td>
                    <Link
                      href={`/manager/players/${p.id}/documents`}
                      className="text-sm font-medium text-kasi-green hover:underline"
                    >
                      Documents
                    </Link>
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