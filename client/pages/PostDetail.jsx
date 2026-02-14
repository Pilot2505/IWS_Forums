import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { User } from "lucide-react";
import { toast } from "sonner";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [comment, setComment] = useState("");

  // Mock post data
  const post = {
    id: 1,
    title: "How To Learn Java",
    author: "An Nguyen",
    authorUsername: "@annguyen",
    timeAgo: "1 day ago",
    content: `Java is one of the most popular programming languages. It is widely used in web, mobile, and enterprise development.

Developers like it for its stability, security, and scalability. In this post, I'll share tips on how to begin your journey learning Java efficiently.

1. Understand the Basics
Before writing complex programs, you need to know the core concepts of Java. This include:
• Java syntax and structure
• Variables and data types
• Conditional statements (if-else, switch)
• Loops (for, while, do-while)
• Functions (methods)
• Basic input and output

Online tutorials and interactive courses are helpful resources for beginners.

2. Get Hands-On Practice
Practice coding by building simple projects or replicating existing ones. Hands-on experience helps you understand how Java works in real applications.

3. Learn Core Java APIs`
  };

  const [comments, setComments] = useState([
    {
      id: 1,
      author: "An Nguyen",
      timeAgo: "1 day ago",
      content: "Feel free to ask any questions about Java!"
    },
    {
      id: 2,
      author: "Rachel",
      timeAgo: "1 day ago",
      content: "Great article. I'm just starting with Java and your guide was very helpful."
    },
    {
      id: 3,
      author: "Alan",
      timeAgo: "1 day ago",
      content: "I recommend building small projects, that's what really helped me"
    }
  ]);

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

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      toast.success("Comment added!");
      setComment("");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#C8CFD8]">
      {/* Top Bar */}
      <header className="h-[75px] bg-[#F6F6F6] flex items-center justify-between px-12">
        <Link to="/" className="text-[#163172] text-4xl font-semibold font-['Poppins']">
          Technical Forum
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/create-post" className="text-[#1E56A0] text-2xl font-medium">
            Create Post
          </Link>
          <div className="w-10 h-10 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="text-[#1E56A0] text-2xl font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex gap-8 px-12 pt-12">
        {/* Post Content */}
        <div className="flex-1 bg-white rounded-lg p-12">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-5xl font-bold text-black">{post.title}</h1>
            <div className="flex gap-4">
              <button className="text-[#1E56A0] text-xl font-medium">Edit</button>
              <button className="text-red-600 text-xl font-medium">Delete</button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-black text-xl">
                By <Link to={`/profile/${post.authorUsername}`} className="text-[#1E56A0] font-medium">{post.author}</Link>
              </p>
              <p className="text-gray-600 text-sm">{post.timeAgo}</p>
            </div>
            <button className="bg-[#1E56A0] text-white px-6 py-2 rounded-md font-medium">
              Follow
            </button>
          </div>

          <div className="text-black text-lg leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>

        {/* Comments Sidebar */}
        <div className="w-[400px]">
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-6">
              Comments <span className="text-gray-500">{comments.length} Comments</span>
            </h3>

            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment here..."
                className="w-full h-24 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1E56A0] placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="mt-2 bg-[#1E56A0] text-white px-6 py-2 rounded-lg font-medium float-right"
              >
                Submit Comment
              </button>
            </form>

            <div className="clear-both space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="border-t pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#21005D]/10 border-2 border-[#D6E4F0] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-black">{c.author}</span>
                        <span className="text-sm text-gray-500">• {c.timeAgo}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{c.content}</p>
                      <button className="text-[#1E56A0] text-sm font-medium mt-2">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
