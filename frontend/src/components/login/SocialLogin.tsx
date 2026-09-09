import type { MouseEventHandler } from "react";
import { ConnectedGoogleButton } from "./ConnectedGoogleButton";

/** GitHub mark glyph. */
function GithubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-ink"
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.99c-3.2.7-3.87-1.35-3.87-1.35-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.06.78 2.13v3.17c0 .3.21.67.8.55A11.53 11.53 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function GithubButton({ label, onClick }: { label: string; onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-[18px] border border-inputborder bg-white text-[15px] font-medium text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-sage/60 hover:bg-ivory/70 hover:shadow-lg active:translate-y-0 active:scale-[0.99]"
    >
      <GithubIcon />
      <span>{label}</span>
    </button>
  );
}

interface SocialLoginProps {
  onGithubLogin: MouseEventHandler<HTMLButtonElement>;
}

/**
 * Two side-by-side social login buttons (Google and GitHub), equal width, with
 * matching hover/press animations.
 *
 * Google is self-contained (ConnectedGoogleButton) and only needs the label;
 * GitHub requires the caller-provided click handler.
 */
export function SocialLogin({ onGithubLogin }: SocialLoginProps) {
  return (
    <div className="flex gap-3">
      <ConnectedGoogleButton label="Google" />
      <GithubButton label="GitHub" onClick={onGithubLogin} />
    </div>
  );
}