/**
 * Horizontal divider with centered "OR CONTINUE WITH" label.
 */
export function Divider() {
  return (
    <div className="flex items-center gap-4" role="presentation">
      <span className="h-px flex-1 bg-hairline" />
      <span className="text-[12px] font-semibold uppercase tracking-wide text-inkmuted">
        Or continue with
      </span>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}
