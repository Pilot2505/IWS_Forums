import { Trash2 } from "lucide-react";

export default function DeletePostConfirmationDialog({
  open,
  title = "Delete this post?",
  message = "This action cannot be undone. This will permanently remove your post and its discussion from the feed.",
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md transform overflow-hidden rounded-[24px] border border-gray-100 bg-white text-left align-middle shadow-2xl transition-all">
        <div className="px-6 pb-6 pt-8 sm:p-8 sm:pb-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-5 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{message}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row sm:justify-end sm:gap-3 sm:px-8">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex w-full justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 sm:w-auto"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex w-full justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 sm:w-auto"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}