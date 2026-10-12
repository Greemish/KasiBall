export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-kasi-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-kasi-green border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}