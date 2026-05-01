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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#F6F6F6] px-4 py-3 shadow-sm sm:px-6 lg:px-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-semibold text-[#163172] font-['Poppins'] sm:text-3xl lg:text-4xl">
          Tech Pulse
        </Link>

        {/* Navigation Items */}
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto sm:gap-5 lg:gap-6">
          {/* Search Bar */}
          <SearchBar />

          {/* shown on all pages except Create Post page */}
          {showCreatePost && (
            <Link to="/create-post" className="text-base font-medium text-[#1E56A0] transition-colors hover:text-[#163172] sm:text-lg lg:text-2xl">
              Create Post
            </Link>
          )}

          {/* User Profile Avatar */}
          {user && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#D6E4F0] bg-[#21005D]/10 transition-transform hover:scale-105 sm:h-11 sm:w-11 sm:border-4"
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
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                  <Link
                    to={`/profile/${user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>

                  <Link
                    to="/bookmarks"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
                  >
                    <Bookmark className="h-4 w-4" />
                    Bookmarks
                  </Link>

                  <Link
                    to="/notifications"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
                  >
                    <Bell className="h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <LogoutButton
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
                  />

                  <DeleteAccountButton 
                    pendingDeletion={Boolean(user?.delete_after_at)}
                    onDeletionChange={(value) => {
                      const updatedUser = { ...user, delete_after_at: value };
                      setUser(updatedUser);
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
