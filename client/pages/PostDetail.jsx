import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { User } from "lucide-react";
import { toast } from "sonner";
import LogoutButton from "./LogoutButton";
import { updatePost, deletePost } from "../services/postService";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [comment, setComment] = useState("");

  const [post, setPost] = useState(null);

  const [comments, setComments] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/register");
      return;
    }

    setUser(JSON.parse(storedUser));

    // Fetch post
    fetch(`/api/posts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then((data) => {
        setPost(data);
        setEditTitle(data.title);
        setEditContent(data.content);
      })
      .catch((err) => {
        console.error(err);
        navigate("/");
      });

    // Fetch comments
    fetch(`/api/posts/${id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data);
      })
      .catch((err) => console.error(err));

  }, [id, navigate]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: comment,
          userId: user.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to comment");

      const newComment = await res.json();

      setComments((prev) => [...prev, newComment]);
      setComment("");
      toast.success("Comment added!");

    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await deletePost(id);

      toast.success("Post deleted successfully");
      navigate("/");

    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleUpdatePost = async () => {
    try {
      await updatePost(id, editTitle, editContent);

      setPost({
        ...post,
        title: editTitle,
        content: editContent,
      });

      setIsEditing(false);
      toast.success("Post updated successfully");

    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  if (!user || !post) return null;

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
          <Link to="/profile" className="w-10 h-10 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center hover:scale-105 transition-transform">
            <User className="w-5 h-5" />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="flex gap-8 px-12 pt-12">
        {/* Post Content */}
        <div className="flex-1 bg-white rounded-lg p-12">
          <div className="flex items-start justify-between mb-4">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border p-3 rounded text-2xl font-bold"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full border p-3 rounded"
                  rows="8"
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleUpdatePost}
                    className="bg-[#1E56A0] text-white px-6 py-2 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="border px-6 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-5xl font-bold text-black mb-6">
                  {post.title}
                </h1>
              </>
            )}
            <div className="flex gap-4">
              {post.user_id === user.id && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[#1E56A0] text-xl font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="text-red-600 text-xl font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <Link
              to={`/profile/${post.username}`}
              className="w-12 h-12 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center hover:scale-105 transition-transform"
            >
              <User className="w-6 h-6" />
            </Link>
            <div className="flex-1">
              <p className="text-black text-xl">
                By <Link to={`/profile/${post.username}`} className="text-[#1E56A0] font-medium">{post.username}</Link>
              </p>
              <p className="text-gray-600 text-sm">{new Date(post.created_at).toLocaleString()}</p>
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
                    <Link
                      to={`/profile/${c.author.toLowerCase().replace(' ', '')}`}
                      className="w-8 h-8 rounded-full bg-[#21005D]/10 border-2 border-[#D6E4F0] flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
                    >
                      <User className="w-4 h-4" />
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-black">{c.username}</span>
                        <span className="text-sm text-gray-500">• {new Date(c.created_at).toLocaleString()}</span>
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
