import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Tag, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/navigation/Navbar";
import { updatePost, deletePost } from "../services/postService";
import FollowButton from "../components/FollowButton";
import { Editor } from "@tinymce/tinymce-react";
import { authFetch } from "../services/api";
import { containsBlockedWord, cleanBlockedWords } from "../utils/moderation";
import PostVoteControls from "../components/PostVoteControls";
import useRequireAuth from "../hooks/useRequireAuth";
import BookmarkButton from "../components/BookmarkButton";
import { stripHtml } from "../utils/content";
import {
  formatTagLabel,
  getMatchingInterestTags,
  normalizeTagsInput,
  parseTagsValue,
} from "../utils/postMeta";

function getStoredInterestCategories() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return Array.isArray(storedUser.categories) ? storedUser.categories : [];
  } catch {
    return [];
  }
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    redirectTo: "/login",
    requireToken: true,
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);

  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");

  useEffect(() => {
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
        setEditTagsInput(parseTagsValue(data.tags).join(", "));
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

    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      toast.error("Comment cannot be empty!");
      return;
    }

    const cleanedCommentText = cleanBlockedWords(trimmedComment);

    try {
      const res = await authFetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: cleanedCommentText,
          user_id: user.id,
          parent_id: replyTo,
        }),
      });

      if (!res.ok) throw new Error("Failed to comment");

      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setComment("");
      setReplyTo(null);

      if (cleanedCommentText !== trimmedComment) {
        toast.success("Comment submitted with filtered content.");
      } else {
        toast.success("Comment added!");
      }
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

      navigate(-1);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleUpdatePost = async () => {
    const trimmedTitle = stripHtml(editTitle).trim();

    if (!trimmedTitle) {
      toast.error("Title is required");
      return;
    }

    if (!editContent.trim() || editContent === "<p><br></p>") {
      toast.error("Content is required");
      return;
    }

    if (containsBlockedWord(trimmedTitle) || containsBlockedWord(editContent)) {
      toast.error(
        "This post contains language that violates community standards. Please edit it!"
      );
      return;
    }

    try {
      const content = editContent;
      const nextTags = normalizeTagsInput(editTagsInput);
      const updatedPost = await updatePost(id, editTitle, content, nextTags);

      setPost({
        ...post,
        title: updatedPost.title || editTitle,
        content,
        tags: updatedPost.tags || nextTags,
        primary_category: updatedPost.primary_category ?? post.primary_category,
        primary_category_label:
          updatedPost.primary_category_label ?? post.primary_category_label,
      });

      setIsEditing(false);
      toast.success("Post updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handlePostVoteChange = ({ voteCount, currentUserVote }) => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            vote_count: voteCount,
            current_user_vote: currentUserVote,
          }
        : prev
    );
  };

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

      setComments((prev) =>
        prev.filter((c) => c.id !== commentId && c.parent_id !== commentId)
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
    level,
  }) {
    return (
      <div
        className={`border-t p-3 pt-4 ${
          replyTo === c.id ? "rounded-md bg-[#21005D]/5" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <Link
            to={`/profile/${c.username}`}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#D6E4F0] bg-[#21005D]/10 transition-transform hover:scale-105"
          >
            {c.avatar ? (
              <img src={c.avatar} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Link>

          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium text-black">{c.username}</span>
              <span className="text-sm text-gray-500">
                • {formatCommentTime(c.created_at)}
              </span>
            </div>

            <p className="text-sm text-gray-700">{c.content}</p>

            {level < maxLevel && (
              <button
                onClick={() => setReplyTo(c.id)}
                className="mt-2 text-sm font-medium text-[#1E56A0]"
              >
                Reply
              </button>
            )}

            {(c.user_id === user.id || post.user_id === user.id) && (
              <button
                onClick={() => handleDeleteComment(c.id)}
                className="ml-2 text-sm text-red-500"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const replyingComment = comments.find((c) => c.id === replyTo);
  const maxLevel = 3;

  const renderComments = (parentId = null, level = 0) => {
    if (level > maxLevel) return null;

    return comments
      .filter((c) => c.parent_id === parentId)
      .map((c) => (
        <div
          key={c.id}
          className={level > 0 ? "ml-8 mt-4 border-l-2 border-gray-200 pl-4" : ""}
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

    return createdDate.toLocaleDateString("vi-VN");
  };

  if (!ready || !user || !post) return null;

  const tags = parseTagsValue(post.tags);
  const userInterests = getStoredInterestCategories();
  const matchingTags = getMatchingInterestTags(tags, userInterests);
  const matchingTagSet = new Set(matchingTags);
  const orderedTags = [
    ...matchingTags,
    ...tags.filter((tag) => !matchingTagSet.has(tag)),
  ];

  return (
    <div className="min-h-screen bg-[#C8CFD8]">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-10 lg:py-10">
        {/* Post Content */}
        <div className="flex-1 rounded-lg bg-white p-5 sm:p-8 lg:p-12">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label htmlFor="post-detail-title-editor" className="mb-1 block text-lg font-semibold text-black">
                    Title
                  </label>
                  <div className="relative min-h-[112px] [&_.tox-edit-area__iframe]:max-h-[112px] [&_.tox-edit-area__iframe]:overflow-y-auto">
                    <Editor
                      id="post-detail-title-editor"
                      tinymceScriptSrc="/tinymce/tinymce.min.js"
                      value={editTitle}
                      onEditorChange={(newTitle) => setEditTitle(newTitle)}
                      init={{
                        license_key: "gpl",
                        promotion: false,
                        branding: false,
                        menubar: false,
                        statusbar: false,
                        placeholder: "Format your title here",
                        height: 100,
                        forced_root_block: false,
                        toolbar: "bold italic underline strikethrough",
                        plugins: [],
                        toolbar_sticky: false,
                        skin_url: "/tinymce/skins/ui/oxide",
                        valid_elements: "b,strong,i,em,u,s,br",
                        element_format: "html",
                        entity_encoding: "raw",
                        content_style: `
                          body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            font-size: 1rem;
                          }
                        `,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <input
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    placeholder="React, performance, UI"
                    className="w-full rounded border p-3 text-base"
                  />
                  <p className="mt-0.5 text-xs text-gray-500">
                    Add multiple tags with commas. Example: React, performance, UI.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-lg font-semibold text-black">
                    Content
                  </label>
                  <Editor
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    value={editContent}
                    onEditorChange={(newContent) => setEditContent(newContent)}
                    init={{
                      license_key: "gpl",
                      promotion: false,
                      branding: false,
                      height:
                        window.innerWidth < 640
                          ? 320
                          : window.innerWidth < 1024
                          ? 380
                          : 400,
                      menubar: true,
                      plugins: ["lists", "link", "image", "code", "table"],
                      toolbar:
                        "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | code",
                    }}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleUpdatePost}
                    disabled={!stripHtml(editTitle).trim() || !editContent.trim()}
                    className="rounded bg-[#1E56A0] px-6 py-2 text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded border px-6 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <h1 className="mb-4 text-3xl font-bold text-black sm:text-4xl lg:mb-6 lg:text-5xl">
                <span dangerouslySetInnerHTML={{ __html: post.title }} />
              </h1>
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
            <Link
              to={`/profile/${post.username}`}
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-4 border-[#D6E4F0] bg-[#21005D]/10 transition-transform hover:scale-105"
            >
              {post.avatar ? (
                <img src={post.avatar} className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6" />
              )}
            </Link>

            <div className="flex-1">
              <p className="text-lg text-black sm:text-xl">
                By{" "}
                <Link
                  to={`/profile/${post.username}`}
                  className="font-medium text-[#1E56A0]"
                >
                  {post.username}
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                {new Date(post.created_at).toLocaleString("en-GB")}
              </p>
            </div>

            <FollowButton currentUserId={user.id} targetUserId={post.user_id} />
          </div>

          <div className="mb-8 flex flex-wrap items-center gap-4">
            <PostVoteControls
              postId={post.id}
              initialVoteCount={post.vote_count ?? 0}
              initialCurrentUserVote={post.current_user_vote ?? 0}
              onChange={handlePostVoteChange}
            />
            <BookmarkButton postId={post.id} initialBookmarked={Boolean(post.is_bookmarked)} />
          </div>

          {tags.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {orderedTags.map((tag) => {
                const isMatched = matchingTagSet.has(tag);

                return (
                  <span
                    key={tag}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isMatched
                        ? "border border-[#1E56A0]/20 bg-[#1E56A0]/10 text-[#1E56A0]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    #{formatTagLabel(tag)}
                  </span>
                );
              })}
            </div>
          )}

          <div
            className="text-base leading-relaxed text-black sm:text-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Comments Sidebar */}
        <div className="w-full lg:sticky lg:top-6 lg:w-[360px] lg:flex-shrink-0 xl:w-[400px]">
          <div className="rounded-lg bg-white p-4 sm:p-6">
            <h3 className="mb-6 text-xl font-semibold sm:text-2xl">
              Comments{" "}
              <span className="text-gray-500">{comments.length} Comments</span>
            </h3>

            <form onSubmit={handleSubmitComment} className="mb-6">
              {replyTo && replyingComment && (
                <div className="mb-3 flex items-center justify-between rounded bg-[#21005D]/5 px-3 py-2 text-sm text-gray-500">
                  <span>
                    Replying to{" "}
                    <span className="font-medium text-[#1E56A0]">
                      {replyingComment.username}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-sm font-medium text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment here..."
                className="h-24 w-full resize-none rounded-lg border border-gray-300 p-4 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E56A0]"
              />

              <button
                type="submit"
                className="ml-auto mt-2 block rounded-lg bg-[#1E56A0] px-6 py-2 font-medium text-white"
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
            <div className="mb-6 flex items-center gap-3">
              <Trash2 className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-semibold text-red-600">
                Are you sure you want to delete this post?
              </h3>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleDeletePost}
                className="rounded-md bg-red-600 px-6 py-2 font-medium text-white"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePostId(null);
                }}
                className="rounded-md border border-gray-300 px-6 py-2 font-medium"
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