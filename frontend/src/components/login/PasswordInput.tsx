import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "className" | "type" | "onChange"
  > {
  /** Value of the password field. */
  value: string;
  /** Callback invoked on every change. */
  onChange: (value: string) => void;
  /** Error message to display, if any. */
  error?: string;
}

const LABEL_CLASSES =
  "mb-2 block text-[13px] font-semibold uppercase tracking-[0.5px] text-forest";
const INPUT_CLASSES =
  "h-[62px] w-full rounded-[17px] border bg-white pl-6 pr-[74px] text-[16px] text-ink placeholder:text-inkmuted/50 outline-none transition-colors duration-200 focus:border-sage focus:ring-2 focus:ring-sage/20";

/**
 * Accessible password field with a visibility toggle and a lock icon.
 */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput(
  { value, onChange, error, id = "password", ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASSES}>
        Password
      </label>
      <div className="relative">
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute left-6 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-inkmuted/60"
          strokeWidth={1.75}
        />
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          className={INPUT_CLASSES}
          value={value}
          placeholder="Enter your password"
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-inkmuted/70 transition-colors hover:text-forest"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <Eye aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-[13px] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
});
