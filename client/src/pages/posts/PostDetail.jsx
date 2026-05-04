import { useState, useEffect, useRef } from "react";
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
import DeletePostConfirmationDialog from "@/components/posts/DeletePostConfirmationDialog";
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

function formatCommentTime(dateString) {
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
}

function buildCommentLookup(commentList) {
  return new Map(commentList.map((comment) => [comment.id, comment]));
}

function isTopLevelComment(comment, commentLookup) {
  if (!comment.parent_id) {
    return true;
  }

  return !commentLookup.get(comment.parent_id);
}

function getCommentRootId(comment, commentLookup) {
  if (isTopLevelComment(comment, commentLookup)) {
    return comment.id;
  }

  let current = comment;

  while (current?.parent_id) {
    const parent = commentLookup.get(current.parent_id);

    if (!parent) {
      break;
    }

    if (isTopLevelComment(parent, commentLookup)) {
      return parent.id;
    }

    current = parent;
  }

  return current?.id ?? comment.id;
}

function isCommentInBranch(commentId, ancestorId, commentLookup) {
  if (commentId === ancestorId) {
    return true;
  }

  let current = commentLookup.get(commentId);

  while (current?.parent_id) {
    if (current.parent_id === ancestorId) {
      return true;
    }

    current = commentLookup.get(current.parent_id);
  }

  return false;
}

function getReplyTargetUsername(comment, commentLookup) {
  if (!comment.parent_id) {
    return null;
  }

  return commentLookup.get(comment.parent_id)?.username ?? null;
}

function CommentItem({
  c,
  user,
  post,
  handleRequestDeleteComment,
  handleStartReply,
  handleSubmitReply,
  onCancelReply,
  replyingToUsername,
  replyComment,
  setReplyComment,
  replyTo,
  isNestedReply = false,
}) {
  const isReplying = replyTo === c.id;
  const replyBoxRef = useRef(null);
  const cancelTriggeredByPointerDownRef = useRef(false);

  useEffect(() => {
    if (!isReplying) {
      return undefined;
    }

    const handleDocumentPointerDown = (event) => {
      const replyBox = replyBoxRef.current;

      if (!replyBox || replyBox.contains(event.target)) {
        return;
      }

      const closed = onCancelReply?.();

      if (!closed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
    };
  }, [isReplying, onCancelReply]);

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
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-forum-inkStrong">
              {c.username}
            </span>
            {replyingToUsername && (
              <span className="text-xs font-medium text-[#717783] sm:text-sm">
                Replying to @{replyingToUsername}
              </span>
            )}
            <span className="text-sm text-forum-subtle">
              {formatCommentTime(c.created_at)}
            </span>
          </div>

          <p className="text-sm leading-7 text-forum-muted">{c.content}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() => handleStartReply(c.id)}
              className="text-sm font-semibold text-[#005da7] transition-colors hover:text-[#004883]"
            >
              Reply
            </button>

            {(c.user_id === user.id || post.user_id === user.id) && (
              <button
                type="button"
                onClick={() => handleRequestDeleteComment(c.id)}
                className="text-sm font-medium text-red-600 transition hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>

          {isReplying && (
            <form
              onSubmit={(event) => handleSubmitReply(event, c.id)}
              className={`mt-4 ${isNestedReply ? "-ml-5 w-[calc(100%+1.25rem)] sm:-ml-8 sm:w-[calc(100%+2rem)]" : ""}`}
            >
              <div
                ref={replyBoxRef}
                className="overflow-hidden rounded-2xl border border-forum-border bg-white shadow-sm"
              >
                <div className="flex flex-col gap-2 border-b border-forum-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#314867] sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-3 sm:gap-y-2">
                  <span className="min-w-0 flex-1 break-words text-left leading-5">
                    Replying to {c.username}
                  </span>
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      cancelTriggeredByPointerDownRef.current = true;
                      onCancelReply?.();
                    }}
                    onClick={(event) => {
                      if (cancelTriggeredByPointerDownRef.current) {
                        cancelTriggeredByPointerDownRef.current = false;
                        return;
                      }

                      event.preventDefault();
                      onCancelReply?.();
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-[#005da7] transition-colors hover:bg-[#eef4ff] hover:text-[#004883] sm:w-auto sm:flex-shrink-0 sm:px-0 sm:py-0 sm:text-right sm:hover:bg-transparent"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  value={replyComment}
                  onChange={(event) => setReplyComment(event.target.value)}
                  placeholder={`Reply to ${c.username}`}
                  className="h-24 w-full resize-none border-0 px-4 py-4 text-sm text-forum-inkStrong placeholder:text-forum-subtle outline-none sm:h-28"
                />
                <div className="flex items-center justify-end border-t border-forum-border px-4 py-3">
                  <button
                    type="submit"
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#005da7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004883] sm:w-auto"
                  >
                    Submit Reply
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
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
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);

  const [comment, setComment] = useState("");
  const [replyComment, setReplyComment] = useState("");
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

  const handleStartReply = (commentId) => {
    setReplyTo(commentId);
    setReplyComment("");
  };

  const handleRequestDeleteComment = (commentId) => {
    setDeleteCommentId(commentId);
    setShowDeleteCommentDialog(true);
  };

  const handleCancelDeleteComment = () => {
    setShowDeleteCommentDialog(false);
    setDeleteCommentId(null);
  };

  const handleCancelReply = () => {
    if (replyComment.trim()) {
      const shouldDiscard = window.confirm("Discard this reply?");

      if (!shouldDiscard) {
        return false;
      }
    }

    setReplyTo(null);
    setReplyComment("");
    return true;
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();

    const trimmedReply = replyComment.trim();

    if (!trimmedReply) {
      toast.error("Reply cannot be empty!");
      return;
    }

    const cleanedReplyText = cleanBlockedWords(trimmedReply);

    try {
      const res = await authFetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: cleanedReplyText,
          user_id: user.id,
          parent_id: parentId,
        }),
      });

      if (!res.ok) throw new Error("Failed to comment");

      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setReplyComment("");
      setReplyTo(null);

      if (cleanedReplyText !== trimmedReply) {
        toast.success("Reply submitted with filtered content.");
      } else {
        toast.success("Reply added!");
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

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      const res = await authFetch(`/api/posts/comments/${deleteCommentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) throw new Error("Not allowed");

      const commentLookup = buildCommentLookup(comments);

      setComments((prev) =>
        prev.filter((candidate) => !isCommentInBranch(candidate.id, deleteCommentId, commentLookup)),
      );

      if (replyTo && isCommentInBranch(replyTo, deleteCommentId, commentLookup)) {
        setReplyTo(null);
        setReplyComment("");
      }

      handleCancelDeleteComment();

      toast.success("Comment deleted!");
    } catch (err) {
      toast.error("You cannot delete this comment");
    }
  };

  const commentLookup = buildCommentLookup(comments);
  const commentToDelete = deleteCommentId ? commentLookup.get(deleteCommentId) : null;
  const topLevelComments = comments.filter((comment) => isTopLevelComment(comment, commentLookup));
  const repliesByRootId = comments.reduce((groups, comment) => {
    if (isTopLevelComment(comment, commentLookup)) {
      return groups;
    }

    const rootId = getCommentRootId(comment, commentLookup);

    if (!groups[rootId]) {
      groups[rootId] = [];
    }

    groups[rootId].push(comment);
    return groups;
  }, {});

  const renderCommentThreads = () =>
    topLevelComments.map((rootComment) => {
      const replies = repliesByRootId[rootComment.id] || [];

      return (
        <div key={rootComment.id} className="space-y-4">
          <CommentItem
            c={rootComment}
            user={user}
            post={post}
            handleRequestDeleteComment={handleRequestDeleteComment}
            handleStartReply={handleStartReply}
            handleSubmitReply={handleSubmitReply}
            onCancelReply={handleCancelReply}
            replyingToUsername={null}
            replyComment={replyComment}
            setReplyComment={setReplyComment}
            replyTo={replyTo}
            isNestedReply={false}
          />

          {replies.length > 0 && (
            <div className="ml-5 mt-4 border-l border-forum-border pl-4 sm:ml-8">
              <div className="space-y-4">
                {replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    c={reply}
                    user={user}
                    post={post}
                    handleRequestDeleteComment={handleRequestDeleteComment}
                    handleStartReply={handleStartReply}
                    handleSubmitReply={handleSubmitReply}
                    onCancelReply={handleCancelReply}
                    replyingToUsername={getReplyTargetUsername(reply, commentLookup)}
                    replyComment={replyComment}
                    setReplyComment={setReplyComment}
                    replyTo={replyTo}
                    isNestedReply={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    });

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
                            ? 420
                            : window.innerWidth < 1024
                              ? 500
                              : 580,
                        menubar: true,
                        plugins: ["lists", "link", "image", "code", "table"],
                        toolbar:
                          "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | code",
                        content_style: `
                          body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            font-size: 1rem;
                            color: #191c1d;
                            margin: 8px;
                          }
                          p {
                            margin: 0 0 0.75em;
                          }
                          p:last-child {
                            margin-bottom: 0;
                          }
                          img {
                            display: block;
                            max-width: 100%;
                            height: auto;
                          }
                          @media (max-width: 640px) {
                            img {
                              max-height: 260px;
                              width: auto;
                            }
                          }
                        `,
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

        <aside className="w-full lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)] lg:w-[380px] lg:flex-shrink-0">
          <div className="flex h-full flex-col rounded-[28px] border border-forum-border bg-forum-surface p-5 shadow-panel sm:p-6 lg:overflow-hidden">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-forum-inkStrong sm:text-3xl">
              Responses{" "}
              <span className="text-forum-subtle">({comments.length})</span>
            </h2>

            <form onSubmit={handleSubmitComment} className="mb-6">
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

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {renderCommentThreads()}
            </div>
          </div>
        </aside>
      </main>

      <DeletePostConfirmationDialog
        open={showDeleteDialog}
        onConfirm={handleDeletePost}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeletePostId(null);
        }}
      />

      {showDeleteCommentDialog && deleteCommentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={handleCancelDeleteComment}
          ></div>

          <div className="relative w-full max-w-md transform overflow-hidden rounded-[24px] border border-gray-100 bg-white text-left align-middle shadow-2xl transition-all">
            <div className="px-6 pb-6 pt-8 sm:p-8 sm:pb-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-5 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-xl font-bold text-gray-900">
                    Delete this comment?
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {commentToDelete ? (
                      commentToDelete.user_id === user.id ? (
                        <>
                          <span className="font-semibold text-gray-700">
                            Your comment
                          </span>{" "}
                          and any replies under it will be removed permanently.
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-gray-700">
                            @{commentToDelete.username}'s comment
                          </span>{" "}
                          and any replies under it will be removed permanently.
                        </>
                      )
                    ) : (
                      "This action cannot be undone. The comment and any replies under it will be removed permanently."
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row sm:justify-end sm:gap-3 sm:px-8">
              <button
                type="button"
                onClick={handleDeleteComment}
                className="inline-flex w-full justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 sm:w-auto"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={handleCancelDeleteComment}
                className="inline-flex w-full justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 sm:w-auto"
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
