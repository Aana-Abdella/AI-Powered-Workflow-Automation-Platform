'use client';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 px-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-xl border border-[#1F2937] bg-[#111827] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-[#F9FAFB]">{title}</h3>
        <p className="mt-2 text-sm text-[#9CA3AF]">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-[#1F2937] px-4 py-2 text-sm text-[#9CA3AF] transition hover:bg-[#0F172A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-[#EF4444] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
