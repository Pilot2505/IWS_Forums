import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "../../services/api";

export default function DeleteAccountButton({
  className,
  pendingDeletion = false,
  onDeletionChange,
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultButtonClassName =
    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-forum-danger transition hover:bg-forum-dangerSoft/70";

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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-6 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-forum-border bg-forum-surface shadow-dialog">
            <div className="flex items-start justify-between gap-4 border-b border-forum-border px-6 py-5">
              <div className="space-y-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forum-dangerSoft text-forum-danger">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold text-forum-inkStrong">
                  {pendingDeletion
                    ? "Cancel deletion request?"
                    : "Delete your account?"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forum-subtle transition hover:bg-forum-panel"
                aria-label="Close delete account dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <p className="text-sm leading-6 text-forum-muted">
                {pendingDeletion
                  ? "This will cancel your pending deletion request and keep your account active."
                  : "We will send a confirmation email. After you confirm and enter your password, your account will be scheduled for deletion in 7 days."}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-forum-danger px-5 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
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
                  className="inline-flex items-center justify-center rounded-2xl border border-forum-border px-5 py-3 font-medium text-forum-ink transition hover:bg-forum-panel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
