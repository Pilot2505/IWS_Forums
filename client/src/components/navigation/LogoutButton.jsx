import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";

export default function LogoutButton({ className }) {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (!showLogoutDialog) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowLogoutDialog(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showLogoutDialog]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutDialog(false);
    navigate("/login", { replace: true });
  };

  const defaultButtonClassName =
    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-forum-ink transition hover:bg-forum-panel";

  return (
    <>
      <button
        type="button"
        onClick={() => setShowLogoutDialog(true)}
        className={className || defaultButtonClassName}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>

      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-6 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-forum-border bg-forum-surface shadow-dialog">
            <div className="flex items-start justify-between gap-4 border-b border-forum-border px-6 py-5">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-forum-inkStrong">
                  Log out?
                </h3>
                <p className="text-sm leading-6 text-forum-muted">
                  Your session will be cleared from this device. You can sign
                  back in at any time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutDialog(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forum-subtle transition hover:bg-forum-panel"
                aria-label="Close logout dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowLogoutDialog(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-forum-border px-5 py-3 font-medium text-forum-ink transition hover:bg-forum-panel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-2xl bg-forum-primary px-5 py-3 font-medium text-white transition hover:bg-forum-primaryDark"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
