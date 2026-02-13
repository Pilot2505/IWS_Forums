import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/register");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#d4e4ec]">
      <header className="flex items-center justify-between px-6 py-5 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-[#1a2332]">Technical Forum</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">Welcome, {user.username}</span>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/login");
            }}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-3xl font-bold text-[#1a2332] mb-4">Welcome to the Technical Forum!</h2>
          <p className="text-gray-600 mb-8">
            This is your minimal school project starter. You can now start adding posts and discussions!
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-[#2b5a8a] text-white px-6 py-2 rounded-md font-medium">
              Create Post
            </button>
            <button className="border border-[#2b5a8a] text-[#2b5a8a] px-6 py-2 rounded-md font-medium">
              Browse Topics
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
