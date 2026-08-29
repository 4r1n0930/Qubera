import { ShieldCheck } from "lucide-react";

/**
 * Subtle security message rendered at the very bottom of the viewport,
 * outside the login card.
 */
export function SecurityFooter() {
  return (
    <footer className="flex items-center justify-center gap-2 px-6 pb-6 text-[14px] text-inkmuted">
      <ShieldCheck aria-hidden="true" className="h-4 w-4 text-inkmuted/70" />
      <span>Your data is secure with us.</span>
    </footer>
  );
}
