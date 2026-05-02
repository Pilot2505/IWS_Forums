import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Bookmark, Plus, User } from "lucide-react";
import LogoutButton from "./LogoutButton";
import DeleteAccountButton from "./DeleteAccountButton";
import SearchBar from "./SearchBar";
import { getNotifications } from "../../services/notificationService";

export default function Navbar({ user, setUser, showCreatePost = true }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const data = await getNotifications({ limit: 1, unreadOnly: false });
        setUnreadCount(data.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setShowLogoutDialog(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutDialog(false);
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-forum-border bg-forum-surface/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-content flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link
          to="/home"
          className="text-3xl font-semibold tracking-tight text-forum-primary sm:text-[2.2rem]"
        >
          Tech Pulse
        </Link>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="w-full lg:w-auto">
            <SearchBar />
          </div>

          {showCreatePost && (
            <Link
              to="/create-post"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-forum-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-forum-primaryDark"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </Link>
          )}

          <div className="flex items-center justify-end gap-2">
            <Link
              to="/bookmarks"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-forum-border bg-forum-surface text-forum-muted transition hover:bg-forum-panel hover:text-forum-primary"
              aria-label="Open saved posts"
            >
              <Bookmark className="h-5 w-5" />
            </Link>

            <Link
              to="/notifications"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-forum-border bg-forum-surface text-forum-muted transition hover:bg-forum-panel hover:text-forum-primary"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-forum-danger px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            {user && (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-forum-border bg-forum-primarySoft text-forum-primary transition hover:scale-[1.02]"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Open account menu"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-[24px] border border-forum-border bg-forum-surface p-3 shadow-dialog">
                    <div className="mb-3 flex items-center gap-3 rounded-2xl bg-forum-panel px-3 py-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-forum-primarySoft text-forum-primary">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-forum-inkStrong">
                          {user.fullname || user.username}
                        </p>
                        <p className="truncate text-xs text-forum-muted">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Link
                        to={`/profile/${user.username}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-forum-ink transition hover:bg-forum-panel"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>

                      <Link
                        to="/bookmarks"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-forum-ink transition hover:bg-forum-panel"
                      >
                        <Bookmark className="h-4 w-4" />
                        Bookmarks
                      </Link>

                      <Link
                        to="/notifications"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-forum-ink transition hover:bg-forum-panel"
                      >
                        <Bell className="h-4 w-4" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="ml-auto rounded-full bg-forum-danger px-2 py-0.5 text-[10px] font-semibold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </Link>

                      <LogoutButton className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-forum-ink transition hover:bg-forum-panel" />

                      <DeleteAccountButton
                        pendingDeletion={Boolean(user?.delete_after_at)}
                        onDeletionChange={(value) => {
                          const updatedUser = {
                            ...user,
                            delete_after_at: value,
                          };
                          setUser(updatedUser);
                          localStorage.setItem(
                            "user",
                            JSON.stringify(updatedUser),
                          );
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
