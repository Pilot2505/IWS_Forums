import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Login successful!");
        // Store user in local storage or state management
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during login");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-forum-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-[-12rem] h-80 w-80 rounded-full bg-forum-primarySoft/70 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-96 w-96 rounded-full bg-forum-primarySoft/50 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-forum-inkStrong">
          Tech Pulse
        </h1>
        <Link
          to="/register"
          className="text-sm font-medium text-forum-muted transition hover:text-forum-primary"
        >
          Register
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <div className="mb-10 text-center">
            <h2 className="text-5xl font-semibold tracking-tight text-forum-inkStrong sm:text-6xl">
              Welcome Back
            </h2>
            <p className="mt-4 text-lg text-forum-muted">
              Sign in to continue your curated pulse.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-dialog backdrop-blur sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-forum-inkStrong"
                >
                  Email or Username
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your credentials"
                  className="h-14 w-full rounded-2xl border border-forum-primarySurface bg-white/60 px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:bg-white focus:ring-2 focus:ring-forum-primary/15"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-forum-inkStrong"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
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
                <div className="mt-2 flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-forum-primary transition hover:text-forum-primaryDark"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-forum-primary text-base font-semibold text-white shadow-lift transition hover:bg-forum-primaryDark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="mt-6 border-t border-forum-border pt-5 text-center text-sm text-forum-muted">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-forum-primary transition hover:text-forum-primaryDark"
                >
                  Register here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
