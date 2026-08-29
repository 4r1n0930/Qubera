/**
 * Thin horizontal decorative line with a small diamond centered on it.
 * Used between the subtitle and the atom illustration.
 */
export function DividerDiamond() {
  return (
    <div
      className="flex items-center justify-center gap-3"
      role="presentation"
      aria-hidden="true"
    >
      <span className="h-px w-16 bg-hairline" />
      <span className="h-1.5 w-1.5 rotate-45 bg-sage/70" />
      <span className="h-px w-16 bg-hairline" />
    </div>
  );
}
