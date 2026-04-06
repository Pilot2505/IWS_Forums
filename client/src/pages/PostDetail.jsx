import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { User } from "lucide-react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { updatePost, deletePost } from "../services/postService";
import FollowButton from "../components/FollowButton";
import { Editor } from "@tinymce/tinymce-react";
import { authFetch } from "../services/api";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);

  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const [post, setPost] = useState(null);

  const [comments, setComments] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser || !localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(storedUser));

    // Fetch post
    authFetch(`/api/posts/${id}`)
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
    authFetch(`/api/posts/${id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data);
      })
      .catch((err) => console.error(err));

  }, [id, navigate]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error("Comment cannot be empty!");
      return;
    }
    
    try {
      const res = await authFetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: comment,
          user_id: user.id,
          parent_id: replyTo
        }),
      });

      if (!res.ok) throw new Error("Failed to comment");

      const newComment = await res.json();

      setComments(prev => [...prev, newComment]);
      setComment("");
      setReplyTo(null);
      toast.success("Comment added!");

    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      await deletePost(deletePostId);

      toast.success("Post deleted successfully!");

      setShowDeleteDialog(false);
      setDeletePostId(null);

      navigate("/profile/" + post.username);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleUpdatePost = async () => {
    // Validate title/content before sending update request
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editContent.trim() || editContent === "<p><br></p>") {
      toast.error("Content is required");
      return;
    }

    try {
      await updatePost(id, editTitle, editContent);

      setPost({
        ...post,
        title: editTitle,
        content: editContent,
      });

      setIsEditing(false);
      toast.success("Post updated successfully!");

    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  if (!user || !post) return null;

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      const res = await authFetch(`/api/posts/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) throw new Error("Not allowed");

      setComments(prev =>
        prev.filter(c => c.id !== commentId && c.parent_id !== commentId)
      );

      toast.success("Comment deleted!");

    } catch (err) {
      toast.error("You cannot delete this comment");
    }
  };

  function CommentItem({
    c,
    user,
    post,
    handleDeleteComment,
    setReplyTo,
    replyTo,
    level
  }) {
    return (
      <div
        className={`border-t pt-4 p-3 ${
          replyTo === c.id ? "bg-[#21005D]/5 rounded-md" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <Link
            to={`/profile/${c.username}`}
            className="w-8 h-8 rounded-full bg-[#21005D]/10 border-2 border-[#D6E4F0] flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform overflow-hidden"
          >
            {c.avatar ? (
              <img
                src={c.avatar}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
          </Link>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-black">{c.username}</span>
              <span className="text-sm text-gray-500">
                • {formatCommentTime(c.created_at)}
              </span>
            </div>

            <p className="text-gray-700 text-sm">{c.content}</p>

            {level < maxLevel && (
              <button
                onClick={() => setReplyTo(c.id)}
                className="text-[#1E56A0] text-sm font-medium mt-2"
              >
                Reply
              </button>
            )}

            {(c.user_id === user.id || post.user_id === user.id) && (
              <button
                onClick={() => handleDeleteComment(c.id)}
                className="text-red-500 text-sm ml-2"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const replyingComment = comments.find(c => c.id === replyTo);

  const maxLevel = 3;
  const renderComments = (parentId = null, level = 0) => {
    if (level > maxLevel) return null;

    return comments
      .filter(c => c.parent_id === parentId)
      .map(c => (
        <div
          key={c.id}
          className={
            level > 0
              ? "ml-8 border-l-2 border-gray-200 pl-4 mt-4"
              : ""
          }
        >
          <CommentItem
            c={c}
            user={user}
            post={post}
            handleDeleteComment={handleDeleteComment}
            setReplyTo={setReplyTo}
            replyTo={replyTo}
            level={level}
          />

          {level < maxLevel && renderComments(c.id, level + 1)}
        </div>
      ));
  };

  const formatCommentTime = (dateString) => {
    const createdDate = new Date(dateString);
    const now = new Date();

    const isSameDay =
      createdDate.getDate() === now.getDate() &&
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear();

    if (isSameDay) {
      // Show time if comment was created today
      return createdDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      // Show date if comment was created on a different day
      return createdDate.toLocaleDateString("vi-VN");
    }
  };

  return (
    <div className="min-h-screen bg-[#C8CFD8]">
      <Navbar user={user} showCreatePost={true} />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-10 lg:py-10">
        {/* Post Content */}
        <div className="flex-1 rounded-lg bg-white p-5 sm:p-8 lg:p-12">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded border p-3 text-xl font-bold sm:text-2xl"
                />
                <Editor
                  tinymceScriptSrc="/tinymce/tinymce.min.js"
                  value={editContent}
                  onEditorChange={(newContent) => setEditContent(newContent)}
                  init={{
                    license_key: "gpl",
                    promotion: false,
                    branding: false,
                    height: window.innerWidth < 640 ? 320 : window.innerWidth < 1024 ? 380 : 400,
                    menubar: true,
                    plugins: [
                      "lists",
                      "link",
                      "image",
                      "code",
                      "table"
                    ],
                    toolbar:
                      "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | code"
                  }}
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleUpdatePost}
                    disabled={!editTitle.trim() || !editContent.trim()}
                    className="bg-[#1E56A0] text-white px-6 py-2 rounded disabled:opacity-50"
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
                <h1 className="mb-4 text-3xl font-bold text-black sm:text-4xl lg:mb-6 lg:text-5xl">
                  {post.title}
                </h1>
              </>
            )}
            <div className="flex gap-4">
              {post.user_id === user.id && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-lg font-medium text-[#1E56A0] sm:text-xl"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeletePostId(post.id);
                      setShowDeleteDialog(true);
                    }}
                    className="text-lg font-medium text-red-600 sm:text-xl"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link to={`/profile/${post.username}`} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-4 border-[#D6E4F0] bg-[#21005D]/10 transition-transform hover:scale-105">
              {post.avatar ? (
                <img
                  src={post.avatar}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </Link>
            <div className="flex-1">
              <p className="text-lg text-black sm:text-xl">
                By <Link to={`/profile/${post.username}`} className="text-[#1E56A0] font-medium">{post.username}</Link>
              </p>
              <p className="text-gray-600 text-sm">{new Date(post.created_at).toLocaleString("en-GB")}</p>
            </div>
            <FollowButton
              currentUserId={user.id}
              targetUserId={post.user_id}
            />
          </div>

          <div className="text-base leading-relaxed text-black sm:text-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Comments Sidebar */}
        <div className="w-full lg:sticky lg:top-6 lg:w-[360px] lg:flex-shrink-0 xl:w-[400px]">
          <div className="rounded-lg bg-white p-4 sm:p-6">
            <h3 className="mb-6 text-xl font-semibold sm:text-2xl">
              Comments <span className="text-gray-500">{comments.length} Comments</span>
            </h3>

            <form onSubmit={handleSubmitComment} className="mb-6">
              {replyTo && replyingComment && (
                <div className="mb-3 text-sm text-gray-500 flex items-center justify-between bg-[#21005D]/5 px-3 py-2 rounded">
                  <span>
                    Replying to <span className="font-medium text-[#1E56A0]">
                      {replyingComment.username}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-gray-500 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment here..."
                className="w-full h-24 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1E56A0] placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="mt-2 bg-[#1E56A0] text-white px-6 py-2 rounded-lg font-medium ml-auto block"
              >
                Submit Comment
              </button>
            </form>

            {renderComments(null)}            
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-md rounded-lg bg-white p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-semibold text-red-600">
                Are you sure you want to delete this post?
              </h3>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleDeletePost}
                className="bg-red-600 text-white px-6 py-2 rounded-md font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePostId(null);
                }}
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
