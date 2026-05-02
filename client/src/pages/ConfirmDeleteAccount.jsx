import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";

export default function ConfirmDeleteAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState("loading");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenStatus("invalid");
        return;
      }

      try {
        const response = await fetch(
          `/api/users/delete-account/verify?token=${encodeURIComponent(token)}`,
        );
        if (!response.ok) {
          setTokenStatus("invalid");
          return;
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

      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Account deletion scheduled for 7 days from now");
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Confirm delete account error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (tokenStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forum-bg px-4">
        <div className="rounded-[28px] border border-forum-border bg-forum-surface p-8 shadow-dialog">
          <p className="text-forum-inkStrong">Verifying deletion link...</p>
        </div>
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forum-bg px-4">
        <div className="w-full max-w-md rounded-[28px] border border-forum-border bg-forum-surface p-8 shadow-dialog">
          {/* Auto-styled: invalid token state inferred from the deletion flow because Figma only provides the confirmation state. */}
          <h1 className="mb-3 text-2xl font-semibold text-forum-inkStrong">
            Invalid link
          </h1>
          <p className="mb-6 text-sm leading-6 text-forum-muted">
            This deletion link is invalid or expired.
          </p>
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-forum-primary px-5 font-medium text-white transition hover:bg-forum-primaryDark"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forum-bg px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-[-12rem] h-96 w-96 rounded-full bg-forum-primarySoft/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-6rem] h-80 w-80 rounded-full bg-forum-primarySoft/50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="mb-8 flex items-center justify-center gap-3 text-forum-inkStrong">
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-forum-primary">
            Tech Pulse
          </span>
        </div>

        <div className="rounded-[28px] border border-forum-border bg-forum-surface p-8 text-center shadow-dialog sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forum-dangerSoft text-forum-danger">
            <TriangleAlert className="h-9 w-9" />
          </div>

          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-forum-inkStrong">
            Confirm account deletion
          </h1>
          <p className="mx-auto mb-8 max-w-md text-lg leading-9 text-forum-muted">
            Enter your password to confirm that you want to delete your account.
            Your account will be deleted after 7 days.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-base font-semibold text-forum-inkStrong"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="h-14 w-full rounded-2xl border border-forum-primarySurface bg-white/60 px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:bg-white focus:ring-2 focus:ring-forum-primary/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-forum-danger px-4 text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Confirming..." : "Confirm deletion"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
