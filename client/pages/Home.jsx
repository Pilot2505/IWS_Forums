import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Mock posts data
  const posts = [
    {
      id: 1,
      title: "How to learn Java",
      content: "Java is one of the most popular programming languages used for web, mobile, and enterprise apps. Developers like it for its stability, security...",
      author: "An",
      timeAgo: "1 day ago"
    },
    {
      id: 2,
      title: "Tips for React",
      content: "React is a powerful library, but beginners often struggle with structure and best practices. In this post, I share practical tips on organizing...",
      author: "Kien",
      timeAgo: "2 days ago"
    }
  ];

  // Mock following users
  const following = [
    { name: "Nguyen Dev", newPosts: 3, hasNew: true },
    { name: "Hoang J", newPosts: 2, hasNew: true },
    { name: "Ronnie", newPosts: 1, hasNew: true },
    { name: "Rob", newPosts: 0, hasNew: false },
    { name: "Cole", newPosts: 0, hasNew: false }
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/register");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      {/* Top Bar */}
      <header className="h-[75px] bg-[#F6F6F6] flex items-center justify-between px-12">
        <Link to="/" className="text-[#163172] text-4xl font-semibold font-['Poppins']">
          Technical Forum
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/create-post" className="text-[#1E56A0] text-2xl font-medium">
            Create Post
          </Link>
          <Link to="/profile" className="w-10 h-10 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center hover:scale-105 transition-transform">
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="text-[#1E56A0] text-2xl font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex gap-8 px-12 pt-12">
        {/* Main Content */}
        <div className="flex-1">
          <Link to="/create-post" className="inline-block bg-[#1E56A0] text-white px-8 py-4 rounded-lg text-xl font-medium mb-8">
            Create a New Post
          </Link>

          <h2 className="text-[#4F6F9F] text-5xl font-medium mb-8">Recent Posts</h2>

          <div className="space-y-8">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#F6F6F6] rounded-lg border-r-[0.5px] border-b-[0.5px] border-black p-8"
              >
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-black text-4xl font-semibold">{post.title}</h3>
                  <p className="text-black text-2xl">
                    By <span className="text-[#1E56A0] font-medium">{post.author}</span>
                  </p>
                </div>
                <p className="text-black text-2xl leading-relaxed mb-8">
                  {post.content}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-black text-xl font-light">{post.timeAgo}</p>
                  <Link
                    to={`/post/${post.id}`}
                    className="text-[#1E56A0] text-[22px] font-medium"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[332px] bg-[#F6F6F6] rounded-lg h-[650px] p-8">
          <h3 className="text-[#0C245E]/70 text-4xl font-medium capitalize mb-8">
            Following
          </h3>

          <div className="space-y-6">
            {following.map((person, index) => (
              <div key={index}>
                <div className="flex items-center gap-4">
                  <Link
                    to={`/profile/${person.name.toLowerCase().replace(' ', '')}`}
                    className={`w-[60px] h-[60px] rounded-full flex items-center justify-center hover:scale-105 transition-transform ${person.hasNew ? 'bg-[#21005D]/10 border-4 border-[#006EFF]' : 'bg-[#21005D]/10 border-4 border-[#D6E4F0]'}`}
                  >
                    <User className="w-8 h-8" />
                  </Link>
                  <div>
                    <p className="text-black text-2xl capitalize">{person.name}</p>
                    {person.newPosts > 0 && (
                      <p className="text-[#0C245E]/70 text-base font-light">
                        {person.newPosts} new post{person.newPosts > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                {index < following.length - 1 && (
                  <div className="h-px bg-black/50 mt-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className="text-xl font-semibold">Are you sure you want to log out?</h3>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleLogout}
                className="bg-[#1E56A0] text-white px-6 py-2 rounded-md font-medium"
              >
                Yes. Log Out
              </button>
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="border border-gray-300 px-6 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
