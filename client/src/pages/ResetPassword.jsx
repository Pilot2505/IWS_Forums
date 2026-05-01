import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword, verifyPasswordResetToken } from "../services/authService";

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
    <div className="min-h-screen bg-[#d4e4ec]">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-xl font-bold text-[#1a2332]">Tech Pulse</h1>
        <Link
          to="/login"
          className="font-medium text-[#2b5a8a] transition-colors hover:text-[#1e4167]"
        >
          Login
        </Link>
      </header>

      <div className="flex items-center justify-center px-4 py-8 sm:pt-8">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-center text-3xl font-bold text-[#0a0a0a] sm:mb-8 sm:text-4xl">
            Create New Password
          </h2>

          <div className="rounded-lg bg-white p-5 shadow-sm sm:p-8">
            {checkingToken ? (
              <p className="text-sm text-gray-600">Checking reset link...</p>
            ) : !tokenValid ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-gray-600">
                  {error || "This reset link is invalid or has expired."}
                </p>
                <Link
                  to="/forgot-password"
                  className="inline-flex rounded-md bg-[#2b5a8a] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#1e4167]"
                >
                  Request a new link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#0a0a0a]"
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
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 pr-20 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2b5a8a]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-sm font-medium text-[#2b5a8a] hover:text-[#1e4167]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-[#0a0a0a]"
                  >
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2b5a8a]"
                    required
                  />
                </div>

                <p className="text-sm text-gray-500">
                  Use at least 6 characters. After saving, you can sign in with your new password.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full rounded-md bg-[#2b5a8a] py-3 font-semibold text-white transition-colors hover:bg-[#1e4167] disabled:bg-gray-400"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}