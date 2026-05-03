import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const fieldLabelClassName =
  "text-xs font-semibold uppercase tracking-wide text-[#314867]";
const fieldInputClassName =
  "w-full rounded-xl border border-[#c1d9fe] bg-white/50 px-4 py-3 text-sm text-[#191c1d] outline-none transition-all placeholder:text-[#717783] focus:border-[#005da7] focus:bg-white focus:ring-2 focus:ring-[#005da7]/20";

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
          JSON.stringify({ ...data.user, categories: null })
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
              Create an Account
            </h1>
            <p className="mt-2 font-medium text-[#485e7e]">Join Tech Pulse today.</p>
          </div>

          <div className="rounded-2xl border border-white/50 bg-white/80 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md sm:p-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className={fieldLabelClassName}>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@email.com"
                  className={fieldInputClassName}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="username" className={fieldLabelClassName}>
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className={fieldInputClassName}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="fullname" className={fieldLabelClassName}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullname"
                  autoComplete="name"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Your full name"
                  className={fieldInputClassName}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className={fieldLabelClassName}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className={`${fieldInputClassName} pr-16`}
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
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={fieldInputClassName}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="profile-pic" className={fieldLabelClassName}>
                  Profile Picture <span className="font-normal lowercase text-[#717783]">(optional)</span>
                </label>
                <input
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  className="w-full rounded-xl border border-[#c1d9fe] bg-white/50 p-1.5 text-sm text-[#485e7e] transition-all file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2ff] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[#005da7] hover:file:bg-[#d4e3ff] focus:outline-none focus:ring-2 focus:ring-[#005da7]/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-[#005da7] py-3.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#004883] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#8bb3d7]"
              >
                {loading ? "Creating account..." : "Register"}
              </button>

              <div className="mt-1 border-t border-[#e1e3e4] pt-2 text-center">
                <p className="text-sm text-[#485e7e]">
                  Already have an account?{" "}
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