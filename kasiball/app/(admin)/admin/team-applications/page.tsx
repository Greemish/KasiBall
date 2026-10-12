"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { FormField } from "@/components/FormField";

type Application = {
  id: string;
  teamName: string;
  clubName: string | null;
  kitDescription: string | null;
  status: string;
  reviewNotes: string | null;
  ageGroup?: { name: string; season?: { name: string } };
  manager?: { firstName: string; lastName: string; phone: string | null };
};

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "CHANGES_REQUESTED", label: "Changes Requested" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export default function TeamApplicationsPage() {
  const [tab, setTab] = useState("PENDING");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"CHANGES_REQUESTED" | "REJECTED" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminTeamApplications(tab);
    if (res.success) setApps(res.data as Application[]);
    else setError(res.error);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    setBusyId(id);
    setError("");
    const res = await api.approveAdminTeamApplication(id);
    if (!res.success) setError(res.error || "Failed to approve");
    setBusyId(null);
    await load();
  };

  const submitReview = async () => {
    if (!reviewId || !reviewAction) return;
    setBusyId(reviewId);
    setError("");
    const res = await api.updateAdminTeamApplication(reviewId, {
      status: reviewAction,
      reviewNotes: reviewNotes || undefined,
    });
    if (!res.success) setError(res.error || "Failed");
    setReviewId(null);
    setReviewAction(null);
    setReviewNotes("");
    setBusyId(null);
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-kasi-green">Team Applications</h1>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-1 border-b border-kasi-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-b-2 border-kasi-green text-kasi-green"
                : "text-kasi-muted hover:text-kasi-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4"><Alert level="error">{error}</Alert></div>}

      {loading ? (
        <LoadingState />
      ) : apps.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No applications in this state.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {apps.map((a) => (
            <li key={a.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{a.teamName}</h3>
                  {a.clubName && <p className="text-sm text-kasi-muted">{a.clubName}</p>}
                  <p className="mt-1 text-xs text-kasi-muted">
                    {a.ageGroup?.name}
                    {a.ageGroup?.season ? ` · ${a.ageGroup.season.name}` : ""}
                  </p>
                  {a.manager && (
                    <p className="mt-1 text-xs text-kasi-muted">
                      {a.manager.firstName} {a.manager.lastName}
                      {a.manager.phone ? ` · ${a.manager.phone}` : ""}
                    </p>
                  )}
                  {a.kitDescription && (
                    <p className="mt-1 text-xs text-kasi-muted">
                      Kit: {a.kitDescription}
                    </p>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>

              {a.reviewNotes && (
                <p className="mt-3 text-sm text-kasi-muted">
                  <strong>Notes:</strong> {a.reviewNotes}
                </p>
              )}

              {(a.status === "PENDING" || a.status === "UNDER_REVIEW" || a.status === "CHANGES_REQUESTED") && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => approve(a.id)}
                    disabled={busyId === a.id}
                    className="btn-primary"
                  >
                    {busyId === a.id ? "Working…" : "Approve"}
                  </button>
                  <button
                    onClick={() => {
                      setReviewId(a.id);
                      setReviewAction("CHANGES_REQUESTED");
                    }}
                    className="btn-secondary"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => {
                      setReviewId(a.id);
                      setReviewAction("REJECTED");
                    }}
                    className="btn-danger"
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!reviewId}
        title={reviewAction === "REJECTED" ? "Reject application" : "Request changes"}
        onClose={() => {
          setReviewId(null);
          setReviewAction(null);
        }}
        actions={
          <>
            <button
              onClick={() => {
                setReviewId(null);
                setReviewAction(null);
              }}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={submitReview}
              className={reviewAction === "REJECTED" ? "btn-danger" : "btn-primary"}
            >
              Confirm
            </button>
          </>
        }
      >
        <FormField label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            rows={4}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="form-input"
            placeholder={
              reviewAction === "REJECTED"
                ? "Reason for rejection"
                : "What needs to change?"
            }
          />
        </FormField>
      </Modal>
    </div>
  );
}