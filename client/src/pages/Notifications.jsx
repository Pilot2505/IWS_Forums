import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import useRequireAuth from "../hooks/useRequireAuth";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";
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

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications(25, false);
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
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
    <div className="min-h-screen bg-[#D6E4F0]">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0C245E] sm:text-4xl">Notifications</h1>
            <p className="mt-2 text-sm text-gray-600">Updates about follows, comments, and replies.</p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="rounded-full border border-[#1E56A0]/20 bg-white px-4 py-2 text-sm font-medium text-[#1E56A0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-lg bg-white p-5">
                <div className="mb-2 h-4 w-1/3 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#1E56A0]/20 bg-white p-10 text-center text-gray-500">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const targetPostId = notification.post_id_ref || notification.post_id;

              return (
                <Link
                  key={notification.id}
                  to={targetPostId ? `/post/${targetPostId}` : `/profile/${encodeURIComponent(notification.actor_username)}`}
                  onClick={() => handleOpenNotification(notification)}
                  className={`block rounded-lg border bg-white p-5 transition-colors hover:border-[#1E56A0]/30 ${
                    notification.is_read ? "border-gray-200" : "border-[#1E56A0]/25 bg-[#1E56A0]/5"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1E56A0]/10 text-[#1E56A0]">
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
                        <span className="font-semibold text-[#0C245E]">{notification.actor_username}</span>
                        <span className="text-sm text-gray-500">{notification.message}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.post_title ? `Post: ${stripHtml(notification.post_title)}` : "Activity update"}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#1E56A0]" />}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
