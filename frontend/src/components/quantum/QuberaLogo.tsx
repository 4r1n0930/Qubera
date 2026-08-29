interface QuberaLogoProps {
  /** Additional classes to customize sizing / spacing. */
  className?: string;
}

/**
 * QUBERA wordmark.
 * Rendered uppercase with wide letter spacing to form the primary branding.
 */
export function QuberaLogo({ className = "" }: QuberaLogoProps) {
  return (
    <span
      className={`font-extrabold uppercase tracking-[0.3em] text-forest select-none ${className}`}
      aria-label="QUBERA"
    >
      QUBERA
    </span>
  );
}
