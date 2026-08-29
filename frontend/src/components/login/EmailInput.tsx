import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Mail } from "lucide-react";

interface EmailInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "className" | "type" | "onChange"
  > {
  /** Value of the email field. */
  value: string;
  /** Callback invoked on every change. */
  onChange: (value: string) => void;
  /** Error message to display, if any. */
  error?: string;
}

const LABEL_CLASSES =
  "mb-2 block text-[13px] font-semibold uppercase tracking-[0.5px] text-forest";
const INPUT_CLASSES =
  "h-[62px] w-full rounded-[17px] border bg-white px-6 text-[16px] text-ink placeholder:text-inkmuted/50 outline-none transition-colors duration-200 focus:border-sage focus:ring-2 focus:ring-sage/20";

/**
 * Accessible email field with an envelope icon on the right.
 */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  function EmailInput({ value, onChange, error, id = "email", ...rest }, ref) {
    return (
      <div>
        <label htmlFor={id} className={LABEL_CLASSES}>
          Email Address
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type="email"
            autoComplete="email"
            className={INPUT_CLASSES}
            value={value}
            placeholder="Enter your email"
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : undefined}
            {...rest}
          />
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-inkmuted/60"
            strokeWidth={1.75}
          />
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="mt-2 text-[13px] text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  },
);
