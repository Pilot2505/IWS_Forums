import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function LogoutButton({ className}) {
    const navigate = useNavigate();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setShowLogoutDialog(false);
        navigate("/login", { replace: true });
        };

    const defaultButtonClassName =
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100";

    return (
    <>
        <button
            onClick={() => setShowLogoutDialog(true)}
            className={className || defaultButtonClassName}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>

        {/* Logout Confirmation Dialog */}
        {showLogoutDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md">
                    <div className="flex items-center gap-3 mb-6">
                    <svg 
                    className="w-6 h-6" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                    </svg>
                    <h3 className="text-xl font-medium text-red-600">Are you sure you want to log out?</h3>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={handleLogout}
                            className="bg-[#1E56A0] text-white px-6 py-2 rounded-md font-medium"
                        >
                            Yes. Log Out
                        </button>
                        <button
                            onClick={() => setShowLogoutDialog(false)}
                            className="bg-gray-200 border border-gray-300 px-6 py-2 rounded-md font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
}
