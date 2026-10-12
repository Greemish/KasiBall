const MAP: Record<string, { label: string; cls: string }> = {
  // verification / application / registration
  VERIFIED: { label: "Verified", cls: "badge-verified" },
  APPROVED: { label: "Approved", cls: "badge-verified" },
  PENDING: { label: "Pending", cls: "badge-pending" },
  UNDER_REVIEW: { label: "Under Review", cls: "badge-info" },
  CHANGES_REQUESTED: { label: "Changes Requested", cls: "badge-pending" },
  REJECTED: { label: "Rejected", cls: "badge-danger" },
  INACTIVE: { label: "Inactive", cls: "badge-neutral" },

  // season
  PLANNED: { label: "Planned", cls: "badge-info" },
  ACTIVE: { label: "Active", cls: "badge-verified" },
  COMPLETED: { label: "Completed", cls: "badge-neutral" },
  CANCELLED: { label: "Cancelled", cls: "badge-danger" },

  // fixture / match
  SCHEDULED: { label: "Scheduled", cls: "badge-info" },
  NOT_STARTED: { label: "Not Started", cls: "badge-neutral" },
  IN_PROGRESS: { label: "In Progress", cls: "badge-pending" },
  FORFEITED: { label: "Forfeited", cls: "badge-danger" },
  ABANDONED: { label: "Abandoned", cls: "badge-danger" },
  NO_RESULT: { label: "No Result", cls: "badge-neutral" },
  POSTPONED: { label: "Postponed", cls: "badge-pending" },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = MAP[status] ?? { label: status, cls: "badge-neutral" };
  return <span className={entry.cls}>{entry.label}</span>;
}