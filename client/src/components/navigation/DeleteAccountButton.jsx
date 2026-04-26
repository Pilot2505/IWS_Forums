import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "../../services/api";

export default function DeleteAccountButton({ className, pendingDeletion = false, onDeletionChange,}) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    const defaultButtonClassName =
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50";

    const handleRequestDeleteAccount = async () => {
        setLoading(true);

        try {
        const response = await authFetch("/api/users/delete-account/request", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to send deletion email");
        }

        toast.success("Confirmation email sent");
        setShowDeleteDialog(false);
        } catch (err) {
        toast.error(err.message || "Failed to send deletion email");
        } finally {
        setLoading(false);
        }
    };

    const handleCancelDeletion = async () => {
        setLoading(true);

        try {
        const response = await authFetch("/api/users/delete-account/cancel", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to cancel deletion");
        }

        toast.success("Deletion request canceled");
        setShowDeleteDialog(false);

        if (onDeletionChange) {
            onDeletionChange(null);
        }
        } catch (err) {
        toast.error(err.message || "Failed to cancel deletion");
        } finally {
        setLoading(false);
        }
    };

    const handleAction = pendingDeletion
        ? handleCancelDeletion
        : handleRequestDeleteAccount;

    return (
        <>
        <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className={className || defaultButtonClassName}
        >
            <Trash2 className="h-4 w-4" />
            {pendingDeletion ? "Cancel deletion request" : "Delete account"}
        </button>

        {showDeleteDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
                <div className="mb-6 flex items-center gap-3">
                <Trash2 className="h-6 w-6 text-red-600" />
                <h3 className="text-xl font-medium text-red-600">
                    {pendingDeletion ? "Cancel deletion request?" : "Delete your account?"}
                </h3>
                </div>

                <p className="mb-6 text-sm text-gray-700">
                {pendingDeletion
                    ? "This will cancel your pending deletion request and keep your account active."
                    : "We will send a confirmation email. After you confirm and enter your password, your account will be scheduled for deletion in 7 days."}
                </p>

                <div className="flex justify-center gap-4">
                <button
                    type="button"
                    onClick={handleAction}
                    disabled={loading}
                    className="rounded-md bg-red-600 px-6 py-2 font-medium text-white disabled:bg-gray-400"
                >
                    {loading
                    ? pendingDeletion
                        ? "Canceling..."
                        : "Sending..."
                    : pendingDeletion
                        ? "Yes, cancel request"
                        : "Yes, send email"}
                </button>
                <button
                    type="button"
                    onClick={() => setShowDeleteDialog(false)}
                    className="rounded-md border border-gray-300 bg-gray-200 px-6 py-2 font-medium"
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