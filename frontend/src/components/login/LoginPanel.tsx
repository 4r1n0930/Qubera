import { LoginCard } from "./LoginCard";
import type { LoginFormValues } from "./LoginForm";

interface LoginPanelProps {
  onLogin: (values: LoginFormValues) => void;
  onGoogleLogin: () => void;
  onGithubLogin: () => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
}

/**
 * Right column of the login page: vertically centers the login card on a
 * white / off-white background.
 */
export function LoginPanel({
  onLogin,
  onGoogleLogin,
  onGithubLogin,
  onForgotPassword,
  onCreateAccount,
}: LoginPanelProps) {
  return (
    <section
      aria-label="Login"
      className="flex flex-1 items-center justify-center overflow-hidden bg-card px-6 py-12"
    >
      <LoginCard
        onLogin={onLogin}
        onGoogleLogin={onGoogleLogin}
        onGithubLogin={onGithubLogin}
        onForgotPassword={onForgotPassword}
        onCreateAccount={onCreateAccount}
      />
    </section>
  );
}
