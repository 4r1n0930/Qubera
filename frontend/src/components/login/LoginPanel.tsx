import { LoginCard } from "./LoginCard";
import type { LoginFormValues } from "./LoginForm";

interface LoginPanelProps {
  onLogin: (values: LoginFormValues) => Promise<void>;
  onGithubLogin: () => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  formError?: string;
}

/**
 * Right column of the login page: vertically centers the login card on a
 * white / off-white background.
 */
export function LoginPanel({
  onLogin,
  onGithubLogin,
  onForgotPassword,
  onCreateAccount,
  formError,
}: LoginPanelProps) {
  return (
    <section
      aria-label="Login"
      className="flex flex-1 items-center justify-center overflow-hidden bg-card px-6 py-12"
    >
      <LoginCard
        onLogin={onLogin}
        onGithubLogin={onGithubLogin}
        onForgotPassword={onForgotPassword}
        onCreateAccount={onCreateAccount}
        formError={formError}
      />
    </section>
  );
}
