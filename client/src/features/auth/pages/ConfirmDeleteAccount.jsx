import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { toast } from "sonner";

const fieldLabelClassName =
  "text-xs font-semibold uppercase tracking-wide text-[#314867]";
const fieldInputClassName =
  "w-full rounded-xl border border-[#c1d9fe] bg-white/50 px-4 py-3 text-sm text-[#191c1d] outline-none transition-all placeholder:text-[#717783] focus:border-[#005da7] focus:bg-white focus:ring-2 focus:ring-[#005da7]/20";
const authCardClassName =
  "rounded-2xl border border-white/50 bg-white/80 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md sm:p-10";

export default function ConfirmDeleteAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState("loading");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenStatus("invalid");
        return;
      }

      try {
        const response = await fetch(`/api/users/delete-account/verify?token=${encodeURIComponent(token)}`);
        if (!response.ok) {
          setTokenStatus("invalid");
          return;
        }

        const data = await response.json();
        if (data.user) {
          setUser((currentUser) => {
            if (currentUser) {
              return {
                ...currentUser,
                ...data.user,
              };
            }

            return data.user;
          });
        }

        setTokenStatus("valid");
      } catch (err) {
        console.error("Token verification failed:", err);
        setTokenStatus("invalid");
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Missing token");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users/delete-account/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to confirm deletion");
        return;
      }

      const updatedUser = data.user;

      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      toast.success("Account deletion scheduled for 7 days from now");
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Confirm delete account error:", err);
      toast.error("Something went wrong");
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

      <Navbar user={user} setUser={setUser} variant="auth" />

      <main className="relative flex min-h-screen items-center justify-center px-4 py-24 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="text-[2.5rem] font-bold leading-tight tracking-tight text-[#001c39] sm:text-5xl">
              Confirm account deletion
            </h1>
            <p className="mt-2 font-medium text-[#485e7e]">
              Enter your password to finalize the deletion request.
            </p>
          </div>

          <div className={authCardClassName}>
            {tokenStatus === "loading" ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c1d9fe] border-t-[#005da7]" />
                <p className="font-medium text-[#485e7e]">Verifying deletion link...</p>
              </div>
            ) : tokenStatus === "invalid" ? (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-[#f2c6c6] bg-[#fff5f5] px-4 py-3 text-sm text-[#7b1d1d]">
                  This deletion link is invalid or expired.
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-[#001c39]">
                    Link unavailable
                  </h2>
                  <p className="text-sm leading-6 text-[#485e7e]">
                    The confirmation link is no longer valid. Request a new deletion email if you still want to remove your account.
                  </p>
                </div>

                <Link
                  to="/"
                  className="mt-1 w-full rounded-xl bg-[#005da7] py-3.5 text-center font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#004883] hover:shadow-lg"
                >
                  Go home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="rounded-xl border border-[#f2c6c6] bg-[#fff5f5] px-4 py-3 text-sm text-[#7b1d1d]">
                  Your account will be scheduled for deletion 7 days after confirmation.
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className={fieldLabelClassName}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={`${fieldInputClassName} pr-16`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#ba1a1a] py-3.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#921111] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#d88c8c]"
                >
                  {loading ? "Confirming..." : "Confirm deletion"}
                </button>

                <div className="mt-1 border-t border-[#e1e3e4] pt-2 text-center">
                  <p className="text-sm text-[#485e7e]">
                    Changed your mind?{" "}
                    <Link
                      to="/"
                      className="font-semibold text-[#005da7] transition-colors hover:text-[#004883] hover:underline"
                    >
                      Go home
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
