"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { FormField } from "@/components/FormField";

type Season = { id: string; name: string; matchDurationMinutes: number };
type AgeGroup = { id: string; name: string };
type Fixture = {
  id: string;
  roundNumber: number;
  scheduled_date: string | null;
  kickoff_time: string | null;
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  ground: { id: string; name: string } | null;
  referee: { id: string; firstName: string; lastName: string } | null;
};

type Ground = { id: string; name: string };
type Referee = { id: string; firstName: string; lastName: string };

const HOURLY_KICKOFFS = Array.from({ length: 24 }, (_, hour) =>
  `${String(hour).padStart(2, "0")}:00`
);

function formatKickoffTime(value: string | null) {
  if (!value) return "09:00";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 5);
  return `${String(parsed.getUTCHours()).padStart(2, "0")}:${String(
    parsed.getUTCMinutes()
  ).padStart(2, "0")}`;
}

function localDateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function AdminFixturesPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [ageGroupId, setAgeGroupId] = useState("");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState("");
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  // schedule modal
  const [schedId, setSchedId] = useState<string | null>(null);
  const [schedForm, setSchedForm] = useState({
    scheduledDate: "",
    kickoffTime: "09:00",
    groundId: "",
    refereeId: "",
  });

  const scheduledFixtures = fixtures.filter((fixture) => fixture.scheduled_date);
  const calendarMonths = Array.from(
    new Set(scheduledFixtures.map((fixture) => fixture.scheduled_date!.slice(0, 7)))
  ).sort();

  useEffect(() => {
    if (calendarMonths.length === 0) {
      setCalendarMonth("");
      return;
    }
    setCalendarMonth((current) =>
      calendarMonths.includes(current) ? current : calendarMonths[0]
    );
  }, [calendarMonths.join("|")]);

  const calendarDate = calendarMonth
    ? new Date(`${calendarMonth}-01T12:00:00`)
    : null;
  const firstWeekday = calendarDate ? (calendarDate.getDay() + 6) % 7 : 0;
  const daysInMonth = calendarDate
    ? new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate()
    : 0;
  const calendarCellCount = calendarDate
    ? Math.ceil((firstWeekday + daysInMonth) / 7) * 7
    : 0;

  useEffect(() => {
    (async () => {
      const [s, g, r] = await Promise.all([
        api.getAdminSeasons(),
        api.getAdminGrounds({ isActive: "true" }),
        api.getAdminReferees({ isActive: "true" }),
      ]);
      if (s.success) {
        setSeasons(s.data as Season[]);
        const first = (s.data as Season[])[0];
        if (first) setSeasonId(first.id);
      }
      if (g.success) setGrounds(g.data as Ground[]);
      if (r.success) setReferees(r.data as Referee[]);
    })();
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    (async () => {
      const res = await api.getAdminAgeGroups(seasonId);
      if (res.success) {
        const ags = res.data as AgeGroup[];
        setAgeGroups(ags);
        setAgeGroupId(ags[0]?.id ?? "");
      }
    })();
  }, [seasonId]);

  const loadFixtures = useCallback(async () => {
    if (!seasonId || !ageGroupId) return;
    setLoading(true);
    const res = await api.getAdminFixtures(seasonId, ageGroupId);
    if (res.success) setFixtures(res.data as Fixture[]);
    else setError(res.error);
    setLoading(false);
  }, [seasonId, ageGroupId]);

  useEffect(() => {
    loadFixtures();
  }, [loadFixtures]);

  const generate = async () => {
    if (!seasonId || !ageGroupId) return;
    setBusy(true);
    setError("");
    const res = await api.generateAdminFixtures(seasonId, ageGroupId, {
      doubleRoundRobin: true,
      balancedHomeAway: true,
    });
    if (!res.success) setError(res.error || "Failed to generate");
    setBusy(false);
    await loadFixtures();
  };

  const clearAll = async () => {
    if (!seasonId || !ageGroupId) return;
    setBusy(true);
    setError("");
    const res = await api.clearAdminFixtures(seasonId, ageGroupId);
    if (!res.success) setError(res.error || "Failed to clear");
    setBusy(false);
    await loadFixtures();
  };

  const openSchedule = (f: Fixture) => {
    setSchedId(f.id);
    setScheduleError("");
    setSchedForm({
      scheduledDate: f.scheduled_date
        ? new Date(f.scheduled_date).toISOString().slice(0, 10)
        : "",
      kickoffTime: formatKickoffTime(f.kickoff_time),
      groundId: f.ground?.id ?? grounds[0]?.id ?? "",
      refereeId: f.referee?.id ?? "",
    });
  };

  const saveSchedule = async () => {
    if (!schedId) return;
    if (!schedForm.scheduledDate) {
      setScheduleError("Choose a Saturday match date.");
      return;
    }
    if (new Date(`${schedForm.scheduledDate}T12:00:00`).getDay() !== 6) {
      setScheduleError("Fixtures must be scheduled on a Saturday.");
      return;
    }
    if (!HOURLY_KICKOFFS.includes(schedForm.kickoffTime)) {
      setScheduleError("Choose a kickoff time on the hour.");
      return;
    }
    if (!schedForm.groundId) {
      setScheduleError("Choose an active ground.");
      return;
    }

    setScheduleError("");
    setScheduleBusy(true);
    const res = await api.scheduleAdminFixture(schedId, {
      scheduledDate: schedForm.scheduledDate,
      kickoffTime: schedForm.kickoffTime,
      groundId: schedForm.groundId,
      refereeId: schedForm.refereeId || null,
    });
    if (!res.success) {
      setScheduleError(res.error || "Failed to schedule fixture.");
      setScheduleBusy(false);
      return;
    }
    setSchedId(null);
    setScheduleBusy(false);
    await loadFixtures();
  };

  return (
    <div>
      <header className="border-b border-kasi-border pb-5">
        <p className="eyebrow">System operations</p>
        <h1 className="mt-1 text-2xl font-bold text-kasi-green">Fixtures registry</h1>
        <p className="mt-2 max-w-3xl text-base text-kasi-muted">
          Generate team pairings, then manually assign each match date, hourly kickoff, ground and referee. Match duration is configured for the season.
        </p>
      </header>

      {/* Selectors */}
      <div className="mt-4 flex flex-wrap gap-3">
        <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)} className="form-input max-w-xs" aria-label="Season">
          {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={ageGroupId} onChange={(e) => setAgeGroupId(e.target.value)} className="form-input max-w-xs" aria-label="Age group">
          {ageGroups.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={generate} disabled={busy || !ageGroupId} className="btn-primary">
          {busy ? "Working…" : "Generate pairings"}
        </button>
        {fixtures.length > 0 && (
          <button onClick={clearAll} disabled={busy} className="btn-danger">
            Clear Fixtures
          </button>
        )}
      </div>

      {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

      {!loading && fixtures.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Fixture view" className="inline-flex border border-kasi-border bg-white p-1">
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={`min-h-10 px-4 text-sm font-semibold ${view === "list" ? "bg-kasi-green text-white" : "text-kasi-ink hover:bg-kasi-surface"}`}
            >
              List view
            </button>
            <button
              type="button"
              aria-pressed={view === "calendar"}
              onClick={() => setView("calendar")}
              className={`min-h-10 px-4 text-sm font-semibold ${view === "calendar" ? "bg-kasi-green text-white" : "text-kasi-ink hover:bg-kasi-surface"}`}
            >
              Calendar view
            </button>
          </div>
          {view === "calendar" && calendarMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="calendar-month" className="form-label">Month</label>
              <select
                id="calendar-month"
                value={calendarMonth}
                onChange={(event) => setCalendarMonth(event.target.value)}
                className="form-input min-h-10 w-auto"
              >
                {calendarMonths.map((month) => (
                  <option key={month} value={month}>
                    {new Date(`${month}-01T12:00:00`).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : fixtures.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">
          No fixtures have been generated for this age group. Generate pairings, then schedule each match manually.
        </p>
      ) : view === "list" ? (
        <div className="mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>R</th>
                <th>Date</th>
                <th>Home</th>
                <th>Away</th>
                <th>Ground</th>
                <th>Referee</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fixtures.map((f) => (
                <tr key={f.id}>
                  <td>{f.roundNumber}</td>
                  <td className="text-sm">
                    {f.scheduled_date
                      ? new Date(f.scheduled_date).toLocaleDateString("en-ZA")
                      : "—"}
                  </td>
                  <td className="font-medium">{f.homeTeam.name}</td>
                  <td className="font-medium">{f.awayTeam.name}</td>
                  <td>{f.ground?.name ?? "—"}</td>
                  <td>
                    {f.referee
                      ? `${f.referee.firstName} ${f.referee.lastName}`
                      : "—"}
                  </td>
                  <td><StatusBadge status={f.status} /></td>
                  <td>
                    <button onClick={() => openSchedule(f)} className="text-sm text-kasi-green hover:underline">
                      Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : scheduledFixtures.length === 0 ? (
        <p className="mt-6 text-base text-kasi-muted">
          No fixtures are scheduled yet. Use list view to assign each pairing manually.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-kasi-border bg-white">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 border-b border-kasi-border bg-kasi-surface text-center text-sm font-semibold text-kasi-ink">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="px-2 py-3">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: calendarCellCount }, (_, index) => {
                const day = index - firstWeekday + 1;
                if (day < 1 || day > daysInMonth || !calendarDate) {
                  return <div key={`empty-${index}`} className="min-h-24 border-b border-r border-kasi-border bg-kasi-surface/40" />;
                }
                const dateKey = `${calendarMonth}-${String(day).padStart(2, "0")}`;
                const dayFixtures = scheduledFixtures.filter(
                  (fixture) => fixture.scheduled_date && localDateKey(fixture.scheduled_date) === dateKey
                );
                return (
                  <div key={dateKey} className={`min-h-24 border-b border-r border-kasi-border p-2 ${dayFixtures.length ? "bg-white" : "bg-kasi-surface/40"}`}>
                    <p className={`text-sm font-semibold ${index % 7 === 5 ? "text-kasi-green" : "text-kasi-muted"}`}>{day}</p>
                    <ul className="mt-1 space-y-1">
                      {dayFixtures.map((fixture) => (
                        <li key={fixture.id}>
                          <button
                            type="button"
                            onClick={() => openSchedule(fixture)}
                            className="w-full border-l-2 border-kasi-gold bg-kasi-surface px-2 py-1 text-left text-xs text-kasi-ink hover:bg-kasi-green/10"
                            aria-label={`Edit ${fixture.homeTeam.name} versus ${fixture.awayTeam.name}, ${formatKickoffTime(fixture.kickoff_time)}`}
                          >
                            <span className="block font-bold">{formatKickoffTime(fixture.kickoff_time)}</span>
                            <span className="block break-words">{fixture.homeTeam.name} vs {fixture.awayTeam.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!schedId}
        title="Schedule fixture"
        onClose={() => {
          setSchedId(null);
          setScheduleError("");
        }}
        actions={
          <>
            <button onClick={() => setSchedId(null)} disabled={scheduleBusy} className="btn-ghost">Cancel</button>
            <button onClick={saveSchedule} disabled={scheduleBusy || !grounds.length} className="btn-primary">
              {scheduleBusy ? "Saving…" : "Save schedule"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {scheduleError && <Alert level="error">{scheduleError}</Alert>}
          <FormField label="Date" htmlFor="sDate">
            <input id="sDate" type="date" value={schedForm.scheduledDate} onChange={(e) => setSchedForm({ ...schedForm, scheduledDate: e.target.value })} className="form-input" aria-describedby="saturday-note" />
          </FormField>
          <p id="saturday-note" className="-mt-3 text-sm text-kasi-muted">Matchday fixtures are scheduled on Saturdays.</p>
          <FormField label="Kickoff time" htmlFor="sTime">
            <select id="sTime" value={schedForm.kickoffTime} onChange={(e) => setSchedForm({ ...schedForm, kickoffTime: e.target.value })} className="form-input">
              {!HOURLY_KICKOFFS.includes(schedForm.kickoffTime) && (
                <option value={schedForm.kickoffTime} disabled>
                  Existing time {schedForm.kickoffTime}; choose an hourly slot
                </option>
              )}
              {HOURLY_KICKOFFS.map((time) => <option key={time} value={time}>{time}</option>)}
            </select>
          </FormField>
          <FormField label="Match duration (season setting)" htmlFor="sDuration">
            <input
              id="sDuration"
              readOnly
              value={`${seasons.find((season) => season.id === seasonId)?.matchDurationMinutes ?? "Unavailable"}${seasons.find((season) => season.id === seasonId) ? " minutes" : ""}`}
              className="form-input bg-kasi-surface"
            />
          </FormField>
          <FormField label="Ground" htmlFor="sGround">
            <select id="sGround" value={schedForm.groundId} onChange={(e) => setSchedForm({ ...schedForm, groundId: e.target.value })} className="form-input">
              {grounds.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </FormField>
          <FormField label="Referee (optional)" htmlFor="sRef">
            <select id="sRef" value={schedForm.refereeId} onChange={(e) => setSchedForm({ ...schedForm, refereeId: e.target.value })} className="form-input">
              <option value="">— none —</option>
              {referees.map((r) => <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>)}
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}