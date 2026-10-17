import { CheckCircle2, X } from 'lucide-react'

export default function AdminActionToast({ toast, onClose }) {
  if (!toast) return null

  return (
    <div
      role="status"
      className="fixed right-4 top-4 z-[120] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-lg sm:right-6 sm:top-6"
    >
      <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={onClose}
        className="-mr-1 -mt-1 rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  )
}
