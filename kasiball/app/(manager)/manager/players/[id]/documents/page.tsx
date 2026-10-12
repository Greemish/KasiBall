"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/app/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";

type Doc = {
  id: string;
  documentType: string;
  verification_status: string;
  url?: string;
  createdAt: string;
};

const TYPES = [
  "IDENTITY_DOCUMENT",
  "BIRTH_CERTIFICATE",
  "PROOF_OF_AGE",
  "MEDICAL_DOCUMENT",
  "CONSENT_FORM",
  "OTHER",
];

export default function DocumentsPage() {
  const params = useParams<{ id: string }>();
  const regId = params?.id;

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!regId) return;
    const res = await api.getPlayerDocuments(regId);
    if (res.success) setDocs(res.data as Doc[]);
    setLoading(false);
  }, [regId]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !regId) return;
    setError("");

    if (file.size > 2 * 1024 * 1024) {
      setError("File must be 2 MB or smaller");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("documentType", type);

    const res = await api.uploadPlayerDocument(regId, fd);
    if (!res.success) {
      setError(res.error || "Upload failed");
    } else {
      setFile(null);
      await load();
    }
    setUploading(false);
  };

  const remove = async (docId: string) => {
    if (!regId) return;
    const res = await api.deletePlayerDocument(regId, docId);
    if (res.success) await load();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-kasi-green">Player Documents</h1>

      {/* Upload */}
      <form onSubmit={upload} className="card mt-6 space-y-4">
        {error && <Alert level="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="form-field">
            <label className="form-label" htmlFor="type">Document type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="form-input"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="file">File (PDF/JPG/PNG, ≤2 MB)</label>
            <input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="form-input"
            />
          </div>
        </div>

        <button type="submit" disabled={!file || uploading} className="btn-primary">
          {uploading ? "Uploading…" : "Upload Document"}
        </button>
      </form>

      {/* List */}
      {docs.length === 0 ? (
        <p className="mt-6 text-sm text-kasi-muted">No documents uploaded yet.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="card flex items-center justify-between">
              <div>
                <span className="font-medium">
                  {d.documentType.replace(/_/g, " ")}
                </span>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-3 text-sm text-kasi-green hover:underline"
                  >
                    View
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={d.verification_status} />
                {d.verification_status !== "VERIFIED" && (
                  <button
                    onClick={() => remove(d.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}