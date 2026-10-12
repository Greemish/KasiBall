"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/app/lib/api";
import { Alert } from "@/components/Alert";
import { LoadingState } from "@/components/LoadingState";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { FormField } from "@/components/FormField";

type Team = {
  id: string;
  name: string;
  squad: { playerId: string; name: string; shirtNumber: number | null }[];
};

type MatchEvent = {
  id: string;
  teamId: string;
  eventType: "GOAL" | "YELLOW_CARD" | "RED_CARD" | "OWN_GOAL";
  minute: number | null;
  notes: string | null;
  team?: { id: string; name: string };
};

type RefereeMatch = {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  fixture: {
    roundNumber: number;
    scheduled_date: string | null;
    kickoff_time: string | null;
    ground: { id: string; name: string } | null;
    ageGroup: { id: string; name: string };
    season: { id: string; name: string; matchDurationMinutes: number };
    homeTeam: { id: string; name: string; club: { id: string; name: string } };
    awayTeam: { id: string; name: string; club: { id: string; name: string } };
  };
  events: MatchEvent[];
};

const EVENT_ACTIONS = [
  { type: "GOAL", label: "Goal", className: "bg-kasi-green text-white hover:bg-kasi-green-dark" },
  { type: "YELLOW_CARD", label: "Yellow card", className: "bg-kasi-gold text-kasi-ink hover:bg-kasi-gold-dark" },
  { type: "RED_CARD", label: "Red card", className: "bg-red-700 text-white hover:bg-red-800" },
  { type: "OWN_GOAL", label: "Own goal", className: "border border-kasi-border bg-white text-kasi-ink hover:bg-kasi-surface" },
] as const;

function formatDate(value: string | null) {
  if (!value) return "Date to be confirmed";
  return new Date(value).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "Time to be confirmed";
  const date = new Date(value);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes()
  ).padStart(2, "0")}`;
}

function eventLabel(type: MatchEvent["eventType"]) {
  return EVENT_ACTIONS.find((action) => action.type === type)?.label ?? type;
}

export default function RefereeMatchControlPage() {
  const params = useParams<{ id: string }>();
  const matchId = params?.id;
  const [match, setMatch] = useState<RefereeMatch | null>(null);
  const [homeRoster, setHomeRoster] = useState<Team | null>(null);
  const [awayRoster, setAwayRoster] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rosterError, setRosterError] = useState("");
  const [teamId, setTeamId] = useState("");
  const [minute, setMinute] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const loadMatch = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    const result = await api.getRefereeMatch(matchId);
    if (!result.success) {
      setError(result.error || "Unable to load this match.");
      setLoading(false);
      return;
    }

    const loadedMatch = result.data as RefereeMatch;
    setMatch(loadedMatch);
    setTeamId(loadedMatch.fixture.homeTeam.id);
    const [homeResult, awayResult] = await Promise.all([
      api.getPublicTeam(loadedMatch.fixture.homeTeam.id),
      api.getPublicTeam(loadedMatch.fixture.awayTeam.id),
    ]);
    if (homeResult.success) setHomeRoster(homeResult.data as Team);
    if (awayResult.success) setAwayRoster(awayResult.data as Team);
    if (!homeResult.success || !awayResult.success) {
      setRosterError("A verified public roster could not be loaded for one or both teams.");
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  const startMatch = async () => {
    if (!match) return;
    setBusy(true);
    setError("");
    const result = await api.startRefereeMatch(match.id);
    if (result.success) {
      setMatch((current) => current ? { ...current, status: "IN_PROGRESS" } : current);
    } else {
      setError(result.error || "Unable to start this match.");
    }
    setBusy(false);
  };

  const recordEvent = async (eventType: MatchEvent["eventType"]) => {
    if (!match || match.status !== "IN_PROGRESS") return;
    if (!teamId) {
      setError("Select the team for this event.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await api.addRefereeEvent(match.id, {
      teamId,
      eventType,
      minute: minute === "" ? null : Number(minute),
      notes: notes.trim() || null,
    });
    if (result.success) {
      const newEvent = result.data as MatchEvent;
      setMatch((current) => current
        ? {
            ...current,
            events: [...current.events, newEvent].sort(
              (left, right) => (left.minute ?? 0) - (right.minute ?? 0)
            ),
          }
        : current
      );
      setNotes("");
    } else {
      setError(result.error || "Unable to record this event.");
    }
    setBusy(false);
  };

  const removeEvent = async (eventId: string) => {
    if (!match) return;
    setBusy(true);
    setError("");
    const result = await api.deleteRefereeEvent(match.id, eventId);
    if (result.success) {
      setMatch((current) => current
        ? { ...current, events: current.events.filter((event) => event.id !== eventId) }
        : current
      );
    } else {
      setError(result.error || "Unable to remove this event.");
    }
    setBusy(false);
  };

  const submitResult = async () => {
    if (!match) return;
    setBusy(true);
    setError("");
    const result = await api.submitRefereeMatch(match.id);
    if (result.success) {
      const submitted = result.data as RefereeMatch;
      setMatch((current) => current
        ? {
            ...current,
            status: submitted.status,
            homeScore: submitted.homeScore,
            awayScore: submitted.awayScore,
          }
        : current
      );
      setConfirmSubmit(false);
    } else {
      setError(result.error || "Unable to submit the official result.");
    }
    setBusy(false);
  };

  if (loading) return <LoadingState />;
  if (!match) return <Alert level="error">{error || "Match not found."}</Alert>;

  const { fixture } = match;
  const inProgress = match.status === "IN_PROGRESS";
  const completed = match.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/referee" className="text-sm font-semibold text-kasi-green underline underline-offset-4">
        Assigned matches
      </Link>

      <section id="overview" className="mt-4 overflow-hidden border border-kasi-border bg-white">
        <div className="bg-kasi-green-dark px-4 py-5 text-white sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-kasi-gold">
                {fixture.season.name} · {fixture.ageGroup.name} · Round {fixture.roundNumber}
              </p>
              <p className="mt-1 text-sm text-white/80">
                {formatDate(fixture.scheduled_date)} · {formatTime(fixture.kickoff_time)}
              </p>
            </div>
            <StatusBadge status={match.status} />
          </div>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center">
            <div className="min-w-0 sm:text-right">
              <p className="break-words text-lg font-bold sm:text-xl">{fixture.homeTeam.name}</p>
              <p className="break-words text-sm text-white/75">{fixture.homeTeam.club.name}</p>
            </div>
            <p className="whitespace-nowrap text-xl font-bold">
              {completed ? `${match.homeScore} - ${match.awayScore}` : "vs"}
            </p>
            <div className="min-w-0 sm:text-left">
              <p className="break-words text-lg font-bold sm:text-xl">{fixture.awayTeam.name}</p>
              <p className="break-words text-sm text-white/75">{fixture.awayTeam.club.name}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/20 pt-3 text-sm text-white/85">
            <span>{fixture.ground?.name ?? "Ground not assigned"}</span>
            <span>{fixture.season.matchDurationMinutes} minute match</span>
          </div>
        </div>

        <nav aria-label="Match control sections" className="grid grid-cols-2 border-b border-kasi-border sm:grid-cols-4">
          {[
            ["#overview", "Overview"],
            ["#live-control", "Live control"],
            ["#add-event", "Add event"],
            ["#final-sign-off", "Final sign-off"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="border-b-2 border-transparent px-3 py-3 text-center text-sm font-semibold text-kasi-muted hover:border-kasi-gold hover:text-kasi-green">
              {label}
            </a>
          ))}
        </nav>
      </section>

      {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

      <section id="live-control" className="mt-7 scroll-mt-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-kasi-border pb-3">
          <div>
            <p className="eyebrow">Match state</p>
            <h2 className="mt-1 text-xl font-bold text-kasi-ink">Live control</h2>
          </div>
          {match.status === "NOT_STARTED" && (
            <button onClick={startMatch} disabled={busy} className="btn-primary min-h-12 w-full sm:w-auto">
              {busy ? "Starting…" : "Start match"}
            </button>
          )}
          {completed && <p className="text-base font-semibold text-kasi-green">Official result submitted</p>}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[homeRoster, awayRoster].map((roster, index) => {
            const team = index === 0 ? fixture.homeTeam : fixture.awayTeam;
            return (
              <div key={team.id} className="border border-kasi-border bg-white p-4">
                <h3 className="font-semibold text-kasi-ink">{team.name}</h3>
                <p className="mt-1 text-sm text-kasi-muted">Verified registered roster</p>
                {!roster ? (
                  <p className="mt-3 text-sm text-kasi-muted">Roster unavailable.</p>
                ) : roster.squad.length === 0 ? (
                  <p className="mt-3 text-sm text-kasi-muted">No verified players listed.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-kasi-border">
                    {roster.squad.map((player) => (
                      <li key={player.playerId} className="flex items-center gap-3 py-2 text-sm">
                        <span className="w-8 shrink-0 text-center font-bold text-kasi-green">
                          {player.shirtNumber ?? "-"}
                        </span>
                        <span className="min-w-0 break-words text-kasi-ink">{player.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        {rosterError && <p className="mt-3 text-sm text-kasi-muted">{rosterError}</p>}
        <p className="mt-3 text-sm text-kasi-muted">
          These are verified registered players, not a confirmed matchday lineup. The referee API does not provide squad confirmation or player registration IDs.
        </p>
      </section>

      <section id="add-event" className="mt-8 scroll-mt-4">
        <div className="border-b border-kasi-border pb-3">
          <p className="eyebrow">Live match record</p>
          <h2 className="mt-1 text-xl font-bold text-kasi-ink">Add event</h2>
        </div>
        {!inProgress ? (
          <p className="mt-4 text-base text-kasi-muted">
            {completed ? "Event entry is closed for this submitted match." : "Start the match before recording events."}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Team" htmlFor="event-team">
                <select id="event-team" value={teamId} onChange={(event) => setTeamId(event.target.value)} className="form-input min-h-11 text-base">
                  <option value={fixture.homeTeam.id}>{fixture.homeTeam.name}</option>
                  <option value={fixture.awayTeam.id}>{fixture.awayTeam.name}</option>
                </select>
              </FormField>
              <FormField label="Minute (optional)" htmlFor="event-minute">
                <input id="event-minute" type="number" min={0} max={200} step={1} value={minute} onChange={(event) => setMinute(event.target.value)} className="form-input min-h-11 text-base" placeholder="e.g. 32" />
              </FormField>
            </div>
            <FormField label="Event note (optional)" htmlFor="event-notes">
              <input id="event-notes" value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} className="form-input min-h-11 text-base" placeholder="Add a short match note" />
            </FormField>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {EVENT_ACTIONS.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => recordEvent(action.type)}
                  disabled={busy}
                  className={`min-h-14 px-3 text-sm font-bold uppercase disabled:cursor-not-allowed disabled:opacity-60 ${action.className}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
            <p className="text-sm leading-6 text-kasi-muted">
              Events are recorded for the selected team. Individual player attribution and assists are not available through the current referee API.
            </p>
          </div>
        )}
      </section>

      <section className="mt-8" aria-labelledby="event-timeline">
        <div className="border-b border-kasi-border pb-3">
          <p className="eyebrow">Official match record</p>
          <h2 id="event-timeline" className="mt-1 text-xl font-bold text-kasi-ink">Event timeline</h2>
        </div>
        {match.events.length === 0 ? (
          <p className="py-4 text-base text-kasi-muted">No events recorded.</p>
        ) : (
          <ol className="divide-y divide-kasi-border border-b border-kasi-border">
            {match.events.map((event) => {
              const eventTeamName = event.team?.name ?? (
                event.teamId === fixture.homeTeam.id
                  ? fixture.homeTeam.name
                  : fixture.awayTeam.name
              );
              return (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-kasi-ink">
                      {event.minute !== null ? `${event.minute}' · ` : ""}{eventLabel(event.eventType)} · {eventTeamName}
                    </p>
                    {event.notes && <p className="mt-1 break-words text-sm text-kasi-muted">{event.notes}</p>}
                  </div>
                  {inProgress && (
                    <button type="button" onClick={() => removeEvent(event.id)} disabled={busy} className="min-h-10 px-2 text-sm font-semibold text-red-700 underline underline-offset-4 disabled:opacity-60">
                      Undo event
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section id="final-sign-off" className="mt-8 scroll-mt-4 border-t border-kasi-border pt-5">
        <p className="eyebrow">Result submission</p>
        <h2 className="mt-1 text-xl font-bold text-kasi-ink">Final sign-off</h2>
        {completed ? (
          <p className="mt-3 text-lg font-bold text-kasi-green">
            {fixture.homeTeam.name} {match.homeScore} - {match.awayScore} {fixture.awayTeam.name}
          </p>
        ) : inProgress ? (
          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-kasi-muted">
              The server calculates the official score from goal and own-goal events.
            </p>
            <button onClick={() => setConfirmSubmit(true)} disabled={busy} className="btn-primary min-h-12 w-full sm:w-auto">
              Review and submit result
            </button>
          </div>
        ) : (
          <p className="mt-3 text-base text-kasi-muted">Start the match before submitting a result.</p>
        )}
      </section>

      <Modal
        open={confirmSubmit}
        title="Submit official result"
        onClose={() => setConfirmSubmit(false)}
        actions={
          <>
            <button onClick={() => setConfirmSubmit(false)} disabled={busy} className="btn-ghost min-h-11">Cancel</button>
            <button onClick={submitResult} disabled={busy} className="btn-primary min-h-11">
              {busy ? "Submitting…" : "Submit result"}
            </button>
          </>
        }
      >
        <p className="text-base leading-6 text-kasi-muted">
          This finalizes the match using the recorded goal and own-goal events. Event editing will close after submission.
        </p>
      </Modal>
    </div>
  );
}