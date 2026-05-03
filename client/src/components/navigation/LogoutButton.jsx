import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

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

    const handleClose = () => {
        setShowLogoutDialog(false);
    };

    const defaultButtonClassName =
        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100";

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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-dialog-title"
                        aria-describedby="logout-dialog-description"
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-sm rounded-xl border border-[#e1e3e4] bg-white p-8 shadow-xl"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffdad6] text-[#ba1a1a]">
                                <LogOut className="h-6 w-6" />
                            </div>

                            <h3
                                id="logout-dialog-title"
                                className="text-xl font-semibold text-[#191c1d]"
                            >
                                Log Out
                            </h3>

                            <p
                                id="logout-dialog-description"
                                className="mt-3 text-sm leading-6 text-[#414751]"
                            >
                                Are you sure you want to log out? You will need to sign back in to
                                participate in the community.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full rounded-lg bg-[#005da7] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2976c7]"
                            >
                                Yes, Log Out
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full rounded-lg border border-[#c1c7d3] bg-white py-2.5 text-sm font-semibold text-[#191c1d] transition-colors hover:bg-[#f8f9fa]"
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