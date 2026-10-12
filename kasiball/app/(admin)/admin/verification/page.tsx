"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";

type Doc = {
  id: string;
  documentType: string;
  verification_status: string;
  url?: string;
  player_registration?: {
    player?: { firstName: string; lastName: string };
    team?: { name: string; club?: { name: string } };
  };
};

export default function VerificationPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await api.getAdminPlayerDocuments({ status: "PENDING" });
    if (res.success) setDocs(res.data as Doc[]);
    else setError(res.error);
    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, kind: "verify" | "reject") => {
    setBusyId(id);
    setError("");
    const res =
      kind === "verify"
        ? await api.verifyAdminPlayerDocument(id)
        : await api.rejectAdminPlayerDocument(id);
    if (!res.success) setError(res.error || "Failed");
    await load(false);
    setBusyId(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-kasi-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Player registrations</p>
            <h1 className="mt-1 text-2xl font-bold text-kasi-green">Document verification</h1>
          </div>
          {!loading && (
            <div className="flex items-baseline gap-2 rounded border border-kasi-border bg-white px-4 py-2">
              <span className="text-2xl font-bold leading-none text-kasi-ink">{docs.length}</span>
              <span className="text-sm text-kasi-muted">awaiting review</span>
            </div>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-sm text-kasi-muted">
          Review submitted player documents and confirm each registration.
        </p>
      </header>

      {error && <div className="mt-5"><Alert level="error">{error}</Alert></div>}

      {loading ? (
        <LoadingState />
      ) : docs.length === 0 ? (
        <div className="mt-6 border border-dashed border-kasi-border bg-white px-6 py-12 text-center">
          <h2 className="font-semibold text-kasi-ink">You’re all caught up</h2>
          <p className="mt-1 text-sm text-kasi-muted">There are no documents waiting for verification.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {docs.map((d) => (
            <li key={d.id} className="card p-0">
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="eyebrow">Document</p>
                  <h2 className="mt-1 font-semibold capitalize text-kasi-ink">
                    {d.documentType.replace(/_/g, " ").toLowerCase()}
                  </h2>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-kasi-ink">
                      {d.player_registration?.player
                        ? `${d.player_registration.player.firstName} ${d.player_registration.player.lastName}`
                        : "Player details unavailable"}
                    </p>
                    {d.player_registration?.team && (
                      <p className="mt-0.5 text-sm text-kasi-muted">
                        {d.player_registration.team.name}
                        {d.player_registration.team.club
                          ? ` · ${d.player_registration.team.club.name}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge status={d.verification_status} />
              </div>

              <div className="flex flex-col gap-3 border-t border-kasi-border bg-kasi-surface/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-kasi-green underline decoration-kasi-green/40 underline-offset-4 hover:decoration-kasi-green"
                  >
                    Open submitted document
                  </a>
                ) : (
                  <span className="text-sm text-kasi-muted">No document link provided</span>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => act(d.id, "verify")}
                    disabled={busyId !== null}
                    className="btn-primary min-w-24"
                  >
                    {busyId === d.id ? "Verifying…" : "Verify"}
                  </button>
                  <button
                    onClick={() => act(d.id, "reject")}
                    disabled={busyId !== null}
                    className="btn-danger min-w-24"
                  >
                    {busyId === d.id ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}