import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";
import { toast } from "sonner";

export default function CreatePost() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/register");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      toast.success("Post created successfully!");
      navigate("/home");
    } else {
      toast.error("Please fill in all fields");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      {/* Top Bar */}
      <header className="h-[75px] bg-[#F6F6F6] flex items-center justify-between px-12">
        <Link to="/home" className="text-[#163172] text-4xl font-semibold font-['Poppins']">
          Technical Forum
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/profile" className="w-10 h-10 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center hover:scale-105 transition-transform">
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={() => navigate("/home")}
            className="text-[#1E56A0] text-2xl font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-12 pt-16">
        <h1 className="text-5xl font-bold text-[#0C245E] mb-12">Create New Post</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="title" className="block text-lg font-semibold text-black mb-3">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E56A0] text-base placeholder:text-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-lg font-semibold text-black mb-3">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content"
              rows="12"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E56A0] text-base resize-none placeholder:text-gray-400"
              required
            />
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="bg-[#1E56A0] text-white px-12 py-3 rounded-md text-lg font-medium hover:bg-[#163d7a] transition-colors"
            >
              Submit Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
