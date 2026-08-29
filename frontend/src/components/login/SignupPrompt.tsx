import type { MouseEventHandler } from "react";

interface SignupPromptProps {
  /** Placeholder handler for the create-account link. */
  onCreateAccount: MouseEventHandler<HTMLButtonElement>;
}

/**
 * Centered prompt at the bottom of the login card pointing to account creation.
 */
export function SignupPrompt({ onCreateAccount }: SignupPromptProps) {
  return (
    <p className="text-center text-[15px] text-inkmuted">
      New to Qubera?{" "}
      <button
        type="button"
        onClick={onCreateAccount}
        className="font-medium text-sage transition-colors hover:text-sage-dark"
      >
        Create an account
      </button>
    </p>
  );
}
