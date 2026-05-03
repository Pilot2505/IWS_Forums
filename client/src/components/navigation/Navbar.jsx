import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Bookmark, User } from "lucide-react";
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
        const data = await getNotifications(1, false);
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
    <header className="sticky top-0 z-50 w-full border-b border-[#e1e3e4] bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-[#005da7]"
        >
          Tech Pulse
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <SearchBar className="hidden md:block" />

          {showCreatePost && (
            <Link
              to="/create-post"
              className="hidden text-sm font-medium text-[#005da7] transition-colors hover:text-[#2976c7] md:inline-flex"
            >
              Create Post
            </Link>
          )}

          {user && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#e1e3e4] bg-[#f3f4f5] transition-transform hover:scale-105"
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
                  <User className="h-4 w-4 text-[#717783]" />
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#e1e3e4] bg-white shadow-lg">
                  <Link
                    to={`/profile/${user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#191c1d] transition-colors hover:bg-[#f3f4f5]"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  
                  <Link
                    to="/notifications"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#191c1d] transition-colors hover:bg-[#f3f4f5]"
                  >
                    <Bell className="h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto rounded-full bg-[#ba1a1a] px-2 py-0.5 text-[10px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/bookmarks"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#191c1d] transition-colors hover:bg-[#f3f4f5]"
                  >
                    <Bookmark className="h-4 w-4" />
                    Bookmarks
                  </Link>

                  <div className="border-t border-[#e1e3e4]">
                    <LogoutButton className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#191c1d] transition-colors hover:bg-[#f3f4f5]" />

                    <DeleteAccountButton
                      pendingDeletion={Boolean(user?.delete_after_at)}
                      onDeletionChange={(value) => {
                        const updatedUser = { ...user, delete_after_at: value };
                        setUser(updatedUser);
                        localStorage.setItem("user", JSON.stringify(updatedUser));
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]/40"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}