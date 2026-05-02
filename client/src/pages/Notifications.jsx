import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import useRequireAuth from "../hooks/useRequireAuth";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import { stripHtml } from "../utils/content";

const formatNotificationTime = (value) => new Date(value).toLocaleString();

export default function Notifications() {
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications({ limit: 5, unreadOnly: false });
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) {
      return undefined;
    }

    const node = sentinelRef.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void handleLoadMore();
        }
      },
      {
        rootMargin: "120px",
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, cursor]);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const data = await getNotifications({
        limit: 5,
        unreadOnly: false,
        cursor,
      });
      setNotifications((prev) => [...prev, ...(data.notifications || [])]);
      setUnreadCount(data.unreadCount || 0);
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, is_read: true })),
    );
    setUnreadCount(0);
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!ready || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-forum-bg">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl">
              Notifications
            </h1>
            <p className="mt-3 text-lg text-forum-muted">
              Updates about follows, comments, and replies.
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex h-11 items-center gap-2 rounded-2xl text-sm font-semibold text-forum-primary transition hover:text-forum-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[24px] border border-forum-border bg-forum-surface p-5 shadow-panel"
              >
                <div className="mb-2 h-4 w-1/3 rounded-full bg-slate-100" />
                <div className="h-4 w-full rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-forum-borderStrong bg-forum-surface p-10 text-center text-forum-muted shadow-panel">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const targetPostId =
                notification.post_id_ref || notification.post_id;

              return (
                <Link
                  key={notification.id}
                  to={
                    targetPostId
                      ? `/post/${targetPostId}`
                      : `/profile/${encodeURIComponent(
                          notification.actor_username,
                        )}`
                  }
                  onClick={() => handleOpenNotification(notification)}
                  className={`block rounded-[24px] border bg-forum-surface p-5 shadow-panel transition ${
                    notification.is_read
                      ? "border-forum-border hover:border-forum-primary/20"
                      : "border-forum-primary bg-forum-primarySoft/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-forum-border bg-forum-primarySoft text-forum-primary">
                      {notification.actor_avatar ? (
                        <img
                          src={notification.actor_avatar}
                          alt={notification.actor_username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        notification.actor_username?.[0]?.toUpperCase() || "U"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-forum-inkStrong">
                          {notification.actor_username}
                        </span>
                        <span className="text-sm text-forum-muted">
                          {notification.message}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-forum-muted">
                        {notification.post_title
                          ? `Post: ${stripHtml(notification.post_title)}`
                          : "Activity update"}
                      </p>
                      <p className="mt-3 text-xs text-forum-subtle">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-forum-primary" />
                    )}
                  </div>
                </Link>
              );
            })}

            {hasMore && <div ref={sentinelRef} className="h-1 w-full" />}
            {loadingMore && (
              <div className="rounded-[24px] border border-forum-border bg-forum-surface p-4 text-center text-sm text-forum-muted shadow-panel">
                Loading more notifications...
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
