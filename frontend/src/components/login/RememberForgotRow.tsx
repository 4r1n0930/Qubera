import type { MouseEventHandler } from "react";

interface RememberForgotRowProps {
  /** Whether the "remember me" checkbox is checked. */
  checked: boolean;
  /** Callback to toggle the checkbox. */
  onToggle: (next: boolean) => void;
  /** Placeholder handler for the forgot-password link. */
  onForgotPassword: MouseEventHandler<HTMLButtonElement>;
}

/**
 * Horizontal row combining a custom "Remember me" checkbox (left) and a
 * "Forgot password?" link (right).
 */
export function RememberForgotRow({
  checked,
  onToggle,
  onForgotPassword,
}: RememberForgotRowProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="group flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border border-sage bg-white transition-colors group-hover:border-sage-dark peer-checked:bg-sage peer-checked:group-hover:bg-sage-dark"
        >
          {/* Check mark drawn when checked */}
          <svg
            viewBox="0 0 16 16"
            className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
            fill="none"
          >
            <path
              d="M3 8.5 6.5 12 13 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-[14px] text-inkmuted transition-colors group-hover:text-ink">
          Remember me
        </span>
      </label>

      <button
        type="button"
        onClick={onForgotPassword}
        className="text-[14px] font-medium text-sage transition-colors hover:text-sage-dark"
      >
        Forgot password?
      </button>
    </div>
  );
}