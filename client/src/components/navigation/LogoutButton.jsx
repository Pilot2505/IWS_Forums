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
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm sm:items-center"
                    onClick={handleClose}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-dialog-title"
                        aria-describedby="logout-dialog-description"
                        onClick={(event) => event.stopPropagation()}
                        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
                    >
                        <div className="h-1.5 bg-gradient-to-r from-[#1E56A0] via-[#4f8bd6] to-[#7cc3ff]" />

                        <div className="px-6 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1E56A0]/10 text-[#1E56A0] ring-1 ring-[#1E56A0]/10">
                                        <LogOut className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 space-y-2">
                                        <h3
                                            id="logout-dialog-title"
                                            className="text-2xl font-semibold tracking-tight text-slate-900"
                                        >
                                            Log out?
                                        </h3>
                                        <p
                                            id="logout-dialog-description"
                                            className="text-sm leading-6 text-red-600"
                                        >
                                            Are you sure you want to log out?
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Close logout dialog"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex items-center justify-center rounded-2xl bg-[#1E56A0] px-5 py-3 font-medium text-white shadow-[0_16px_40px_rgba(30,86,160,0.28)] transition hover:bg-[#16487f]"
                            >
                                Yes, log out
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
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