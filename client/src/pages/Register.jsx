import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("username", username);
    formData.append("fullname", fullname);
    formData.append("password", password);

    if (avatar) {
      formData.append("avatar", avatar);
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...data.user, categories: null }),
        );
        toast.success("Account created successfully!");
        navigate("/select-categories");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred during registration");
      console.error("Register error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-forum-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-8rem] top-[-10rem] h-96 w-96 rounded-full bg-forum-primarySoft/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[-6rem] h-80 w-80 rounded-full bg-forum-primarySoft/50 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-forum-inkStrong">
          Tech Pulse
        </h1>
        <Link
          to="/login"
          className="text-sm font-medium text-forum-muted transition hover:text-forum-primary"
        >
          Login
        </Link>
      </header>

      <main className="relative z-10 flex items-center justify-center px-4 pb-12 pt-4">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <h2 className="text-5xl font-semibold tracking-tight text-forum-inkStrong sm:text-6xl">
              Create an Account
            </h2>
            <p className="mt-4 text-lg text-forum-muted">
              Join Tech Pulse today.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-dialog backdrop-blur sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-forum-inkStrong"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@email.com"
                  className="h-14 w-full rounded-2xl border border-forum-primarySurface bg-white/60 px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:bg-white focus:ring-2 focus:ring-forum-primary/15"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-forum-inkStrong"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="h-14 w-full rounded-2xl border border-forum-primarySurface bg-white/60 px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:bg-white focus:ring-2 focus:ring-forum-primary/15"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="fullname"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-forum-inkStrong"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullname"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Your full name"
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
                    placeholder="Create a password"
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
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-forum-inkStrong"
                >
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="h-14 w-full rounded-2xl border border-forum-primarySurface bg-white/60 px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:bg-white focus:ring-2 focus:ring-forum-primary/15"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-forum-inkStrong">
                  Profile Picture (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  className="block h-14 w-full rounded-2xl border border-forum-primarySurface bg-white/60 px-4 py-3 text-sm text-forum-muted file:mr-4 file:rounded-xl file:border-0 file:bg-forum-primarySoft file:px-4 file:py-2 file:font-semibold file:text-forum-primary hover:file:bg-forum-primarySoft/80"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-forum-primary text-base font-semibold text-white shadow-lift transition hover:bg-forum-primaryDark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>

            <p className="mt-6 border-t border-forum-border pt-5 text-center text-sm text-forum-muted">
              Already have an account?{" "}
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
