import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully!");
        navigate("/login");
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
    <div className="min-h-screen bg-[#d4e4ec]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <h1 className="text-xl font-bold text-[#1a2332]">Technical Forum</h1>
        <Link 
          to="/login" 
          className="text-[#2b5a8a] hover:text-[#1e4167] font-medium transition-colors"
        >
          Login
        </Link>
      </header>

      {/* Register Form */}
      <div className="flex items-center justify-center px-4 pt-8">
        <div className="w-full max-w-md">
          <h2 className="text-4xl font-bold text-center text-[#0a0a0a] mb-8">
            Register
          </h2>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-semibold text-[#0a0a0a] mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2b5a8a] focus:border-transparent placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Username Field */}
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-sm font-semibold text-[#0a0a0a] mb-2"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2b5a8a] focus:border-transparent placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-[#0a0a0a] mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2b5a8a] focus:border-transparent placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2b5a8a] hover:bg-[#1e4167] disabled:bg-gray-400 text-white font-semibold py-3 rounded-md transition-colors mt-6"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center mt-5 text-sm text-[#0a0a0a]">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="text-[#2b5a8a] hover:text-[#1e4167] font-medium transition-colors"
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
