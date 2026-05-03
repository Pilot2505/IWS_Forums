import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCheck,
  Clock3,
  Heart,
  Inbox,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Reply,
  UserPlus,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import useRequireAuth from "@/hooks/useRequireAuth";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";
import { stripHtml } from "@/utils/content";

const formatNotificationTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffInMinutes < 1) {
    return "Just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays === 1) {
    return "Yesterday";
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getNotificationMeta = (notification) => {
  switch (notification.type) {
    case "follow":
      return {
        icon: UserPlus,
        badgeClass: "bg-[#a06900] text-white",
        avatarTone: "bg-[#ffddb4] text-[#633f00]",
        avatarBorder: "border-[#c1c7d3]",
      };
    case "comment_reply":
      return {
        icon: Reply,
        badgeClass: "bg-[#005da7] text-white",
        avatarTone: "bg-[#eef5ff] text-[#005da7]",
        avatarBorder: "border-[#c1d9fe]",
      };
    case "comment":
      return {
        icon: MessageSquare,
        badgeClass: "bg-[#005da7] text-white",
        avatarTone: "bg-[#eef5ff] text-[#005da7]",
        avatarBorder: "border-[#c1d9fe]",
      };
    case "like":
      return {
        icon: Heart,
        badgeClass: "bg-[#496080] text-white",
        avatarTone: "bg-[#d4e3ff] text-[#496080]",
        avatarBorder: "border-[#c1d9fe]",
      };
    case "system":
      return {
        icon: Megaphone,
        badgeClass: "bg-[#717783] text-white",
        avatarTone: "bg-[#e1e3e4] text-[#414751]",
        avatarBorder: "border-[#c1c7d3]",
      };
    default:
      return {
        icon: MessageSquare,
        badgeClass: "bg-[#005da7] text-white",
        avatarTone: "bg-[#eef5ff] text-[#005da7]",
        avatarBorder: "border-[#c1d9fe]",
      };
  }
};

const getNotificationTarget = (notification) => {
  const postId = notification.post_id_ref || notification.post_id;

  if (postId) {
    return `/post/${postId}`;
  }

  if (notification.actor_username) {
    return `/profile/${encodeURIComponent(notification.actor_username)}`;
  }

  return "/notifications";
};

function NotificationSkeleton() {
  return (
    <article className="flex animate-pulse gap-4 rounded-xl border border-[#c1c7d3] bg-white p-4 shadow-sm sm:p-5">
      <div className="relative shrink-0">
        <div className="h-12 w-12 rounded-full border border-[#c1c7d3] bg-[#e1e3e4]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="h-4 w-2/3 rounded bg-[#e1e3e4]" />
        <div className="mt-3 h-12 rounded-lg bg-[#f3f4f5]" />
        <div className="mt-3 h-4 w-28 rounded bg-[#e1e3e4]" />
      </div>
    </article>
  );
}

function NotificationCard({ notification, onOpen }) {
  const meta = getNotificationMeta(notification);
  const Icon = meta.icon;
  const targetPath = getNotificationTarget(notification);
  const actorName = notification.actor_username || "System Update";
  const isSystemNotice = notification.type === "system" || !notification.actor_username;
  const showPreview = Boolean(notification.post_title) && notification.type !== "follow";

  return (
    <Link
      key={notification.id}
      to={targetPath}
      onClick={() => onOpen(notification)}
      className={`group relative block overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f8f9fa] hover:shadow-md sm:p-5 ${
        notification.is_read
          ? "border-[#c1c7d3]"
          : "border-[#c1d9fe] shadow-[0_10px_24px_rgba(0,93,167,0.08)]"
      }`}
    >
      {!notification.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#005da7]" />}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <MoreHorizontal className="h-5 w-5 text-[#717783]" />
      </span>

      <div className="flex gap-4">
        <div className="relative shrink-0">
          {isSystemNotice ? (
            <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${meta.avatarBorder} ${meta.avatarTone}`}>
              <Icon className="h-5 w-5" />
            </div>
          ) : (
            <>
              <div className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border ${meta.avatarBorder} bg-[#f3f4f5]`}>
                {notification.actor_avatar ? (
                  <img
                    src={notification.actor_avatar}
                    alt={notification.actor_username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className={`text-sm font-semibold ${meta.avatarTone}`}>
                    {notification.actor_username?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-[2px]">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${meta.badgeClass}`}>
                  <Icon className="h-3 w-3" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {isSystemNotice ? (
            <>
              <p className="text-[16px] leading-6 text-[#191c1d]">
                <span className="font-semibold">System Update</span>
              </p>
              <p className="mt-1 text-[16px] leading-6 text-[#414751]">
                {notification.message}
              </p>
            </>
          ) : (
            <p className={`text-[16px] leading-6 ${notification.is_read ? "text-[#414751]" : "text-[#191c1d]"}`}>
              <span className="font-semibold text-[#191c1d]">{actorName}</span> {notification.message}
            </p>
          )}

          {showPreview && (
            <div className="mt-3 rounded-lg border border-[#c1c7d3] bg-[#f3f4f5] p-3">
              <p className="text-sm font-medium leading-6 text-[#191c1d]">
                Post: {stripHtml(notification.post_title)}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#414751]">
                Open the post to see the full context.
              </p>
            </div>
          )}

          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#717783]">
            <Clock3 className="h-4 w-4" />
            {formatNotificationTime(notification.created_at)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function EmptyNotificationsState() {
  return (
    <div className="rounded-xl border border-dashed border-[#c1c7d3] bg-white p-8 text-center shadow-sm sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5ff] text-[#005da7]">
        <Inbox className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-[#191c1d]">No notifications yet</h2>
      <p className="mt-2 text-sm leading-6 text-[#414751]">
        Updates about follows, comments, and replies will appear here.
      </p>
      <Link
        to="/home"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#005da7] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2976c7]"
      >
        Explore the feed
      </Link>
    </div>
  );
}

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

  useEffect(() => {
    if (!ready || !user) {
      return undefined;
    }

    const fetchNotifications = async () => {
      setLoading(true);

      try {
        const data = await getNotifications({ limit: 5, unreadOnly: false });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchNotifications();
  }, [ready, user]);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) {
      return;
    }

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
    if (unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenNotification = async (notification) => {
    if (notification.is_read) {
      return;
    }

    try {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  if (!ready || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] antialiased">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#005da7]">
              Activity feed
            </p>
            <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-[#191c1d] sm:text-[40px]">
              Notifications
            </h1>
            <p className="mt-2 text-[16px] leading-6 text-[#414751]">
              Updates about follows, comments, and replies.
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-transparent px-0 py-2 text-sm font-medium text-[#005da7] transition-colors hover:text-[#2976c7] disabled:cursor-not-allowed disabled:text-[#717783] sm:self-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyNotificationsState />
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onOpen={handleOpenNotification}
              />
            ))}
          </div>
        )}

        {hasMore && notifications.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center justify-center rounded-lg border border-[#c1c7d3] bg-white px-6 py-3 text-sm font-medium text-[#005da7] transition-colors hover:bg-[#f3f4f5] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingMore ? "Loading more notifications..." : "Load More"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
