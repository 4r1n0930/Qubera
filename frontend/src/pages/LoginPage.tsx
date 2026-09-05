import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { QuantumBrandPanel } from "../components/quantum/QuantumBrandPanel";
import { QuberaLogo } from "../components/quantum/QuberaLogo";
import { LoginPanel } from "../components/login/LoginPanel";
import { SecurityFooter } from "../components/login/SecurityFooter";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import type { LoginFormValues } from "../components/login/LoginForm";

/**
 * Full-screen login page for QUBERA.
 *
 * Desktop: two-column split (ivory brand panel on the left, white login panel
 * on the right) with the security footer spanning the bottom of the viewport.
 * Mobile: stacks vertically, keeps the QUBERA branding at the top and hides
 * the heavy atom illustration.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithToken, isAuthenticated } = useAuth();
  const [formError, setFormError] = useState<string | undefined>(undefined);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setFormError(undefined);

      const res = await authService.login(values.email, values.password);

      if (!res.ok) {
        if (res.notVerified) {
          authService.setPendingEmail(values.email);
          navigate("/verify-email", { replace: true });
          return;
        }
        throw new Error(res.message || "Login failed");
      }

      if (res.data?.token) {
        loginWithToken(res.data.token);
        try {
          localStorage.setItem("token", res.data.token);
        } catch {
          /* ignore */
        }
      } else {
        login();
      }

      try {
        if (res.data?.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          localStorage.setItem("qubera_user", JSON.stringify(res.data.user));
        }
      } catch {
        /* ignore */
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong");
    }
  };
  const handleGoogleLogin = () => {
    login();
    navigate("/dashboard", { replace: true });
  };
  const handleGithubLogin = () => {
    login();
    navigate("/dashboard", { replace: true });
  };
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };
  const handleCreateAccount = () => {
    navigate("/signup");
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
          formError={formError}
        />
      </div>

      <SecurityFooter />
    </div>
  );
}
