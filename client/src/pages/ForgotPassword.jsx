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
    <div className="min-h-screen bg-[#d4e4ec]">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-xl font-bold text-[#1a2332]">Tech Pulse</h1>
        <Link
          to="/login"
          className="font-medium text-[#2b5a8a] transition-colors hover:text-[#1e4167]"
        >
          Back to login
        </Link>
      </header>

      <div className="flex items-center justify-center px-4 py-8 sm:pt-8">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-center text-3xl font-bold text-[#0a0a0a] sm:mb-8 sm:text-4xl">
            Reset Password
          </h2>

          <div className="rounded-lg bg-white p-5 shadow-sm sm:p-8">
            <p className="mb-5 text-sm leading-6 text-gray-600">
              Enter your email or username and we will send a secure reset link.
              The link expires in 1 hour.
            </p>

            {sent && (
              <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Email has been sent. Please check your inbox for the reset link.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold text-[#0a0a0a]"
                >
                  Email or Username
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or Username"
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2b5a8a]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-md bg-[#2b5a8a] py-3 font-semibold text-white transition-colors hover:bg-[#1e4167] disabled:bg-gray-400"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[#0a0a0a]">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="font-medium text-[#2b5a8a] transition-colors hover:text-[#1e4167]"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}