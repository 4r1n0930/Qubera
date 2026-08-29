import { ArrowRight, Loader2 } from "lucide-react";

interface LoginButtonProps {
  /** Whether a login is in progress (shows a spinner and disables the button). */
  loading: boolean;
}

/**
 * Large pill-shaped primary login button with a separated arrow icon.
 * Submits its parent form.
 */
export function LoginButton({ loading }: LoginButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group flex h-[60px] w-full items-center justify-center gap-4 rounded-full bg-forest text-[17px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-forest-light active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <>
          <span>Logging in…</span>
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        </>
      ) : (
        <>
          <span>Log in</span>
          <ArrowRight
            aria-hidden="true"
            className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </>
      )}
    </button>
  );
}
