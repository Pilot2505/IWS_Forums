import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Tag, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import { updatePost, deletePost } from "@/services/postService";
import FollowButton from "@/components/social/FollowButton";
import { Editor } from "@tinymce/tinymce-react";
import { authFetch } from "@/services/api";
import { containsBlockedWord, cleanBlockedWords } from "@/utils/moderation";
import PostVoteControls from "@/components/posts/PostVoteControls";
import useRequireAuth from "@/hooks/useRequireAuth";
import BookmarkButton from "@/components/posts/BookmarkButton";
import { stripHtml } from "@/utils/content";
import {
  formatTagLabel,
  getMatchingInterestTags,
  normalizeTagsInput,
  parseTagsValue,
} from "@/utils/postMeta";

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
        "This post contains language that violates community standards. Please edit it!",
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
        : prev,
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
        prev.filter((c) => c.id !== commentId && c.parent_id !== commentId),
      );

      toast.success("Comment deleted!");
    } catch (err) {
      toast.error("You cannot delete this comment");
    }
  };

  const maxLevel = 3;

  const formatCommentTime = (dateString) => {
    const createdDate = new Date(dateString);
    const now = new Date();

    const isSameDay =
      createdDate.getDate() === now.getDate() &&
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear();

    if (isSameDay) {
      return createdDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return createdDate.toLocaleDateString("vi-VN");
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
        className={`rounded-2xl p-4 transition ${replyTo === c.id ? "bg-forum-primarySoft/30" : "bg-transparent"
          }`}
      >
        <div className="flex items-start gap-3">
          <Link
            to={`/profile/${c.username}`}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-forum-border bg-forum-primarySoft text-forum-primary transition-transform hover:scale-105"
          >
            {c.avatar ? (
              <img
                src={c.avatar}
                alt={c.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Link>

          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-medium text-forum-inkStrong">
                {c.username}
              </span>
              <span className="text-sm text-forum-subtle">
                {formatCommentTime(c.created_at)}
              </span>
            </div>

            <p className="text-sm leading-7 text-forum-muted">{c.content}</p>

            {level < maxLevel && (
              <button
                type="button"
                onClick={() => setReplyTo(c.id)}
                className="mt-3 text-sm font-semibold text-[#005da7] transition-colors hover:text-[#004883]"
              >
                Reply
              </button>
            )}

            {(c.user_id === user.id || post.user_id === user.id) && (
              <button
                type="button"
                onClick={() => handleDeleteComment(c.id)}
                className="ml-3 text-sm font-medium text-red-600 transition hover:text-red-700"
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

  const renderComments = (parentId = null, level = 0) => {
    if (level > maxLevel) return null;

    return comments
      .filter((c) => c.parent_id === parentId)
      .map((c) => (
        <div
          key={c.id}
          className={
            level > 0
              ? "ml-5 mt-4 border-l border-forum-border pl-4 sm:ml-8"
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
    <div className="min-h-screen bg-forum-bg">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto flex max-w-content flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:px-10 lg:py-10">
        <section className="min-w-0 flex-1 rounded-[28px] border border-forum-border bg-forum-surface p-5 shadow-panel sm:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {isEditing ? (
              <div className="flex-1 space-y-5">
                <div>
                  <label
                    htmlFor="post-detail-title-editor"
                    className="mb-3 block text-xl font-semibold text-forum-inkStrong"
                  >
                    Title
                  </label>
                  <div className="overflow-hidden rounded-2xl border border-forum-border bg-white shadow-sm">
                    <div className="relative min-h-[112px] [&_.tox]:border-0 [&_.tox-editor-header]:border-b [&_.tox-editor-header]:border-forum-border [&_.tox-edit-area__iframe]:max-h-[112px] [&_.tox-edit-area__iframe]:overflow-y-auto">
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
                            html {
                              overflow-y: auto !important; 
                            }
                            body {
                              font-family: Inter, system-ui, sans-serif;
                              font-size: 1rem;
                              color: #191c1d;
                              margin: 8px;
                            }
                            p {
                              margin: 0; 
                            }
                          `,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-3 flex items-center gap-2 text-lg font-semibold text-forum-inkStrong">
                    <Tag className="h-4 w-4" />
                    Tags
                  </label>
                  <input
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    placeholder="React, performance, UI"
                    className="h-14 w-full rounded-2xl border border-forum-border bg-white px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15"
                  />
                  <p className="mt-3 text-sm leading-6 text-forum-muted">
                    Add multiple tags with commas. Example: React, performance,
                    UI.
                  </p>
                </div>

                <div>
                  <label className="mb-3 block text-xl font-semibold text-forum-inkStrong">
                    Content
                  </label>
                  <div className="overflow-hidden rounded-2xl border border-forum-border bg-white shadow-sm">
                    <Editor
                      tinymceScriptSrc="/tinymce/tinymce.min.js"
                      value={editContent}
                      onEditorChange={(newContent) =>
                        setEditContent(newContent)
                      }
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
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#005da7] px-5 font-medium text-[#005da7] transition-colors hover:bg-[#005da7]/5 hover:text-[#004883]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdatePost}
                    disabled={
                      !stripHtml(editTitle).trim() || !editContent.trim()
                    }
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h1 className="text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl">
                  <span dangerouslySetInnerHTML={{ __html: post.title }} />
                </h1>
              </div>
            )}

            {post.user_id === user.id && !isEditing && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-2xl border border-[#005da7] px-4 py-2 text-sm font-semibold text-[#005da7] transition-colors hover:bg-[#005da7]/5 hover:text-[#004883]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeletePostId(post.id);
                    setShowDeleteDialog(true);
                  }}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {!isEditing && (
            <>
              <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-forum-border bg-forum-panel/60 p-5 sm:flex-row sm:items-center">
                <Link
                  to={`/profile/${post.username}`}
                  className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-forum-border bg-forum-primarySoft text-forum-primary transition-transform hover:scale-105"
                >
                  {post.avatar ? (
                    <img
                      src={post.avatar}
                      alt={post.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <p className="text-lg text-forum-muted">
                    By{" "}
                    <Link
                      to={`/profile/${post.username}`}
                      className="font-semibold text-forum-primary transition hover:text-forum-primaryDark"
                    >
                      {post.username}
                    </Link>
                  </p>
                  <p className="text-sm text-forum-subtle">
                    {new Date(post.created_at).toLocaleString("en-GB")}
                  </p>
                </div>

                <FollowButton
                  currentUserId={user.id}
                  targetUserId={post.user_id}
                />
              </div>

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PostVoteControls
                  postId={post.id}
                  initialVoteCount={post.vote_count ?? 0}
                  initialCurrentUserVote={post.current_user_vote ?? 0}
                  onChange={handlePostVoteChange}
                />
                <BookmarkButton
                  postId={post.id}
                  initialBookmarked={Boolean(post.is_bookmarked)}
                />
              </div>

              {tags.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  {orderedTags.map((tag) => {
                    const isMatched = matchingTagSet.has(tag);

                    return (
                      <span
                        key={tag}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${isMatched
                            ? "bg-forum-primarySoft text-forum-primary"
                            : "bg-forum-panel text-forum-muted"
                          }`}
                      >
                        #{formatTagLabel(tag)}
                      </span>
                    );
                  })}
                </div>
              )}

              <div
                className="prose prose-slate max-w-none text-base leading-8 text-forum-ink sm:text-lg"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </>
          )}
        </section>

        <aside className="w-full lg:sticky lg:top-28 lg:w-[380px] lg:flex-shrink-0">
          <div className="rounded-[28px] border border-forum-border bg-forum-surface p-5 shadow-panel sm:p-6">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-forum-inkStrong sm:text-3xl">
              Responses{" "}
              <span className="text-forum-subtle">({comments.length})</span>
            </h2>

            <form onSubmit={handleSubmitComment} className="mb-6">
              {replyTo && replyingComment && (
                <div className="mb-4 flex items-center justify-between rounded-2xl bg-forum-primarySoft/30 px-4 py-3 text-sm text-forum-muted">
                  <span>
                    Replying to{" "}
                    <span className="font-semibold text-forum-primary">
                      {replyingComment.username}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="font-semibold text-[#005da7] transition-colors hover:text-[#004883]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-forum-border bg-white shadow-sm">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your thoughts?"
                  className="h-28 w-full resize-none border-0 px-4 py-4 text-sm text-forum-inkStrong placeholder:text-forum-subtle outline-none"
                />
                <div className="flex items-center justify-end border-t border-forum-border px-4 py-3">
                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#005da7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004883] sm:w-auto"
                  >
                    Submit Comment
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2">{renderComments(null)}</div>
          </div>
        </aside>
      </main>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          {/* Lớp nền đen mờ + hiệu ứng blur */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowDeleteDialog(false);
              setDeletePostId(null);
            }}
          ></div>

          {/* Hộp thoại chính */}
          <div className="relative w-full max-w-md transform overflow-hidden rounded-[24px] bg-white text-left align-middle shadow-2xl transition-all border border-gray-100">
            {/* Nội dung bên trên */}
            <div className="px-6 pb-6 pt-8 sm:p-8 sm:pb-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-5 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-xl font-bold text-gray-900">
                    Delete this post?
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    This action cannot be undone. This will permanently remove your post and its discussion from the feed.
                  </p>
                </div>
              </div>
            </div>

            {/* Khu vực nút bấm bên dưới */}
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8">
              <button
                type="button"
                onClick={handleDeletePost}
                className="inline-flex w-full justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 sm:ml-3 sm:w-auto"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePostId(null);
                }}
                className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 sm:mt-0 sm:w-auto"
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
