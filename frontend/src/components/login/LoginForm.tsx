import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { EmailInput } from "./EmailInput";
import { PasswordInput } from "./PasswordInput";
import { RememberForgotRow } from "./RememberForgotRow";
import { LoginButton } from "./LoginButton";

export interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  /** Called when the form passes validation and is submitted. */
  onSubmit: (values: LoginFormValues) => void;
  /** Placeholder shown below the form (e.g. validation summary). */
  formError?: string;
  /** Handler for the forgot-password link. */
  onForgotPassword: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: LoginFormValues) {
  const errors: { email?: string; password?: string } = {};
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.password) {
    errors.password = "Password is required.";
  }
  return errors;
}

/**
 * Wired login form: composed of email + password inputs, a remember-me row
 * and the submit button. Owns its field state and validation.
 */
export function LoginForm({ onSubmit, formError, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validate({ email, password });
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email) {
        emailRef.current?.focus();
      }
      return;
    }

    setLoading(true);
    // Frontend-only: defer actual auth to a placeholder that the parent handles.
    window.setTimeout(() => {
      setLoading(false);
      onSubmit({ email: email.trim(), password });
    }, 900);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <EmailInput
          ref={emailRef}
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
          error={errors.password}
        />

        <RememberForgotRow
          checked={remember}
          onToggle={setRemember}
          onForgotPassword={() => onForgotPassword()}
        />

        <LoginButton loading={loading} />

        {formError && (
          <p role="alert" className="text-center text-[13px] text-red-700">
            {formError}
          </p>
        )}
      </div>
    </form>
  );
}
