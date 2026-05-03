import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword, verifyPasswordResetToken } from "@/services/authService";

const fieldLabelClassName =
  "text-xs font-semibold uppercase tracking-wide text-[#314867]";
const fieldInputClassName =
  "w-full rounded-xl border border-[#c1d9fe] bg-white/50 px-4 py-3 text-sm text-[#191c1d] outline-none transition-all placeholder:text-[#717783] focus:border-[#005da7] focus:bg-white focus:ring-2 focus:ring-[#005da7]/20";

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
    <div
      className="relative isolate min-h-screen overflow-hidden bg-[#e6ebf5] text-[#191c1d] antialiased"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#d9e5ff] blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-72 w-72 rounded-full bg-[#bfd5ff] blur-3xl" />
        <div className="absolute bottom-[-5rem] left-1/3 h-80 w-80 rounded-full bg-[#e1ebff] blur-3xl" />
      </div>

      <header className="absolute left-0 top-0 z-10 flex w-full items-center justify-between px-6 py-5 sm:px-8 sm:py-6">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-[#001c39] transition-colors hover:text-[#005da7]"
        >
          Tech Pulse
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-[#485e7e] transition-colors hover:text-[#001c39]"
        >
          Login
        </Link>
      </header>

      <main className="relative flex min-h-screen items-center justify-center px-4 py-24 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="text-[2.5rem] font-bold leading-tight tracking-tight text-[#001c39] sm:text-5xl">
              Reset Password
            </h1>
            <p className="mt-2 font-medium text-[#485e7e]">
              Create a new password to regain access to your account.
            </p>
          </div>

          <div className="rounded-2xl border border-white/50 bg-white/80 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md sm:p-10">
            {checkingToken ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c1d9fe] border-t-[#005da7]" />
                <p className="font-medium text-[#485e7e]">Checking reset link...</p>
              </div>
            ) : !tokenValid ? (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-[#f2c6c6] bg-[#fff5f5] px-4 py-3 text-sm text-[#7b1d1d]">
                  {error || "This reset link is invalid or has expired."}
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-[#001c39]">
                    Link unavailable
                  </h2>
                  <p className="text-sm leading-6 text-[#485e7e]">
                    Request a new reset email to continue changing your password.
                  </p>
                </div>

                <Link
                  to="/forgot-password"
                  className="mt-1 w-full rounded-xl bg-[#005da7] py-3.5 text-center font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#004883] hover:shadow-lg"
                >
                  Request a new link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="rounded-xl border border-[#d6e7fb] bg-[#f5faff] px-4 py-3 text-sm leading-6 text-[#29507a]">
                  Use at least 6 characters. After saving, you can sign in with your new password.
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className={fieldLabelClassName}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                      className={`${fieldInputClassName} pr-16`}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#005da7] transition-colors hover:text-[#004883]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="confirmPassword" className={fieldLabelClassName}>
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={fieldInputClassName}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full rounded-xl bg-[#005da7] py-3.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#004883] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#8bb3d7]"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>

                <div className="mt-1 border-t border-[#e1e3e4] pt-2 text-center">
                  <p className="text-sm text-[#485e7e]">
                    Remembered your password?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-[#005da7] transition-colors hover:text-[#004883] hover:underline"
                    >
                      Login
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
