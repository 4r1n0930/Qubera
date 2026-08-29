import type { MouseEventHandler } from "react";

/** Official multi-color Google "G" glyph. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a7.06 7.06 0 0 1 0-4.2V7.06H2.18a11.5 11.5 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
      />
    </svg>
  );
}

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

interface SocialButtonProps {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

function GoogleButton({ label, onClick }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[18px] border border-inputborder bg-white text-[15px] font-medium text-ink transition-all duration-200 hover:border-hairline hover:bg-ivory/60"
    >
      <GoogleIcon />
      <span>{label}</span>
    </button>
  );
}

function GithubButton({ label, onClick }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[18px] border border-inputborder bg-white text-[15px] font-medium text-ink transition-all duration-200 hover:border-hairline hover:bg-ivory/60"
    >
      <GithubIcon />
      <span>{label}</span>
    </button>
  );
}

interface SocialLoginProps {
  onGoogleLogin: MouseEventHandler<HTMLButtonElement>;
  onGithubLogin: MouseEventHandler<HTMLButtonElement>;
}

/**
 * Two side-by-side social login buttons (Google and GitHub).
 */
export function SocialLogin({
  onGoogleLogin,
  onGithubLogin,
}: SocialLoginProps) {
  return (
    <div className="flex gap-3">
      <GoogleButton label="Google" onClick={onGoogleLogin} />
      <GithubButton label="GitHub" onClick={onGithubLogin} />
    </div>
  );
}
