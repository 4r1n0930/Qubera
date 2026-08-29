import { LoginHeader } from "./LoginHeader";
import { LoginForm } from "./LoginForm";
import type { LoginFormValues } from "./LoginForm";
import { Divider } from "./Divider";
import { SocialLogin } from "./SocialLogin";
import { SignupPrompt } from "./SignupPrompt";

interface LoginCardProps {
  /** Submit handler for the login form. */
  onLogin: (values: LoginFormValues) => void;
  /** Placeholder for Google social login. */
  onGoogleLogin: () => void;
  /** Placeholder for GitHub social login. */
  onGithubLogin: () => void;
  /** Placeholder for forgot-password navigation. */
  onForgotPassword: () => void;
  /** Placeholder for create-account navigation. */
  onCreateAccount: () => void;
}

/**
 * White login card: holds the heading, form, social login and signup prompt
 * with generous internal padding and a soft, understated shadow.
 */
export function LoginCard({
  onLogin,
  onGoogleLogin,
  onGithubLogin,
  onForgotPassword,
  onCreateAccount,
}: LoginCardProps) {
  return (
    <div className="flex w-full max-w-[620px] flex-col rounded-[30px] border border-cardborder bg-card p-10 shadow-[0_24px_60px_-30px_rgba(11,61,50,0.18)] sm:w-[580px] sm:p-[60px]">
      <LoginHeader />

      <div className="mt-10">
        <LoginForm onSubmit={onLogin} onForgotPassword={onForgotPassword} />
      </div>

      <div className="mt-9">
        <Divider />
      </div>

      <div className="mt-7">
        <SocialLogin
          onGoogleLogin={(e) => {
            e.preventDefault();
            onGoogleLogin();
          }}
          onGithubLogin={(e) => {
            e.preventDefault();
            onGithubLogin();
          }}
        />
      </div>

      <div className="mt-auto pt-8">
        <SignupPrompt
          onCreateAccount={(e) => {
            e.preventDefault();
            onCreateAccount();
          }}
        />
      </div>
    </div>
  );
}
