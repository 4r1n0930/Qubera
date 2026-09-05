import { QuantumBrandPanel } from "../components/quantum/QuantumBrandPanel";
import { QuberaLogo } from "../components/quantum/QuberaLogo";
import { LoginPanel } from "../components/login/LoginPanel";
import { SecurityFooter } from "../components/login/SecurityFooter";
import type { LoginFormValues } from "../components/login/LoginForm";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
/**
 * Full-screen login page for QUBERA.
 *
 * Desktop: two-column split (ivory brand panel on the left, white login panel
 * on the right) with the security footer spanning the bottom of the viewport.
 * Mobile: stacks vertically, keeps the QUBERA branding at the top and hides
 * the heavy atom illustration.
 */
export function LoginPage() {
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const handleLogin = async (values: LoginFormValues) => {
    try {
      setLoginError("");

      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");


    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };
  const handleGoogleLogin = () => {
    // Placeholder for Google OAuth flow.
  };
  const handleGithubLogin = () => {
    // Placeholder for GitHub OAuth flow.
  };
  const handleForgotPassword = () => {
    // Placeholder: navigate to the password-recovery route.
  };
  const handleCreateAccount = () => {
    // Placeholder: navigate to the signup route.
  };

  return (
    <div className="flex min-h-screen flex-col md:h-screen">
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Compact mobile branding */}
        <header className="flex flex-col items-center gap-3 bg-ivory px-6 py-8 md:hidden">
          <QuberaLogo className="text-4xl" />
          <p className="text-base font-medium text-sage">
            Learn. Experiment. Understand Quantum.
          </p>
        </header>

        <QuantumBrandPanel />

        <LoginPanel
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onGithubLogin={handleGithubLogin}
          onForgotPassword={handleForgotPassword}
          onCreateAccount={handleCreateAccount}
          formError={loginError}
        />
      </div>

      <SecurityFooter />
    </div>
  );
}
