import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
        const response = await fetch(`/api/users/delete-account/verify?token=${encodeURIComponent(token)}`);
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
      <div className="flex min-h-screen items-center justify-center bg-[#d4e4ec]">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <p className="text-[#1a2332]">Verifying deletion link...</p>
        </div>
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#d4e4ec] px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
          <h1 className="mb-3 text-2xl font-bold text-[#1a2332]">Invalid link</h1>
          <p className="mb-6 text-sm text-gray-600">
            This deletion link is invalid or expired.
          </p>
          <Link
            to="/"
            className="inline-flex rounded-md bg-[#2b5a8a] px-4 py-2 font-medium text-white hover:bg-[#1e4167]"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#d4e4ec] px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-3 text-2xl font-bold text-[#1a2332]">Confirm account deletion</h1>
        <p className="mb-6 text-sm text-gray-600">
          Enter your password to confirm that you want to delete your account. Your account will be deleted after 7 days.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#0a0a0a]">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2b5a8a]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? "Confirming..." : "Confirm deletion"}
          </button>
        </form>
      </div>
    </div>
  );
}