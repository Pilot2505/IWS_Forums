import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { requestPasswordReset } from "../services/authService";

const fieldLabelClassName =
  "text-xs font-semibold uppercase tracking-wide text-[#314867]";
const fieldInputClassName =
  "w-full rounded-xl border border-[#c1d9fe] bg-white/50 px-4 py-3 text-sm text-[#191c1d] outline-none transition-all placeholder:text-[#717783] focus:border-[#005da7] focus:bg-white focus:ring-2 focus:ring-[#005da7]/20";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      toast.error("Enter your email or username");
      return;
    }

    setLoading(true);

    try {
      const data = await requestPasswordReset(trimmedIdentifier);
      setSent(true);
      toast.success(data.message || "Email has been sent.");
    } catch (error) {
      toast.error(error.message || "Unable to send reset link");
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
              Forgot Password
            </h1>
            <p className="mt-2 font-medium text-[#485e7e]">
              Enter your email or username to receive a reset link.
            </p>
          </div>

          <div className="rounded-2xl border border-white/50 bg-white/80 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md sm:p-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {sent && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                  If an account exists for that email or username, a reset link has been sent.
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="identifier" className={fieldLabelClassName}>
                  Email or Username
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or Username"
                  className={fieldInputClassName}
                  autoComplete="username"
                  required
                />
              </div>

              <p className="text-sm leading-6 text-[#485e7e]">
                We will send a secure reset link. The link expires in 1 hour.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-[#005da7] py-3.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#004883] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#8bb3d7]"
              >
                {loading ? "Sending..." : "Send reset link"}
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
          </div>
        </div>
      </main>
    </div>
  );
}
