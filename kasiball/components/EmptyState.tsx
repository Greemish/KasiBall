export function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="rounded border border-dashed border-kasi-border py-10 text-center text-sm text-kasi-muted">
      {message}
    </div>
  );
}