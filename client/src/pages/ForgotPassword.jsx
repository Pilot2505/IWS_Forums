import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { requestPasswordReset } from "../services/authService";

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
    <div className="relative min-h-screen overflow-hidden bg-forum-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-forum-primarySoft/60 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-4rem] h-80 w-80 rounded-full bg-forum-primarySoft/50 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-forum-inkStrong">
          Tech Pulse
        </h1>
        <Link
          to="/login"
          className="text-sm font-medium text-forum-primary transition hover:text-forum-primaryDark"
        >
          Back to login
        </Link>
      </header>

      <main className="relative z-10 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl">
              Reset Password
            </h2>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-dialog backdrop-blur sm:p-10">
            <p className="mb-6 text-center text-lg leading-9 text-forum-muted">
              Enter your email or username and we will send a secure reset link.
              The link expires in 1 hour.
            </p>

            {sent && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Email has been sent. Please check your inbox for the reset link.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold text-forum-inkStrong"
                >
                  Email or Username
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com"
                  className="h-14 w-full rounded-2xl border border-forum-primarySurface bg-white/60 px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:bg-white focus:ring-2 focus:ring-forum-primary/15"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-forum-primary text-base font-semibold text-white shadow-lift transition hover:bg-forum-primaryDark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-forum-muted">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-forum-primary transition hover:text-forum-primaryDark"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
