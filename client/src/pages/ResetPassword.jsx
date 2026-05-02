import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  resetPassword,
  verifyPasswordResetToken,
} from "../services/authService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!token) {
        if (isMounted) {
          setError("Missing password reset token.");
          setCheckingToken(false);
        }
        return;
      }

      try {
        await verifyPasswordResetToken(token);
        if (isMounted) {
          setTokenValid(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "This reset link is invalid or expired.");
        }
      } finally {
        if (isMounted) {
          setCheckingToken(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = await resetPassword({ token, password, confirmPassword });
      toast.success(data.message || "Password updated successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-forum-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-forum-primarySoft/60 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-4rem] h-96 w-96 rounded-full bg-forum-primarySoft/50 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-forum-primary">
          Tech Pulse
        </h1>
        <Link
          to="/login"
          className="text-sm font-medium text-forum-inkStrong transition hover:text-forum-primary"
        >
          Login
        </Link>
      </header>

      <main className="relative z-10 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl">
              Create New Password
            </h2>
            <p className="mt-4 text-lg text-forum-muted">
              Secure your account with a strong password.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-dialog backdrop-blur sm:p-10">
            {checkingToken ? (
              <p className="text-sm text-forum-muted">Checking reset link...</p>
            ) : !tokenValid ? (
              <div className="space-y-4">
                {/* Auto-styled: invalid token state inferred from the auth card pattern because Figma only shows the valid form state. */}
                <p className="text-sm leading-6 text-forum-muted">
                  {error || "This reset link is invalid or has expired."}
                </p>
                <Link
                  to="/forgot-password"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-forum-primary px-5 font-semibold text-white transition hover:bg-forum-primaryDark"
                >
                  Request a new link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-forum-inkStrong"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                      className="h-14 w-full rounded-2xl border border-forum-primarySurface bg-white/60 px-4 pr-20 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:bg-white focus:ring-2 focus:ring-forum-primary/15"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-forum-primary transition hover:text-forum-primaryDark"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-forum-inkStrong"
                  >
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="h-14 w-full rounded-2xl border border-forum-primarySurface bg-white/60 px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:bg-white focus:ring-2 focus:ring-forum-primary/15"
                    required
                  />
                </div>

                <p className="text-sm leading-7 text-forum-muted">
                  Use at least 6 characters. After saving, you can sign in with
                  your new password.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-forum-primary text-base font-semibold text-white shadow-lift transition hover:bg-forum-primaryDark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
