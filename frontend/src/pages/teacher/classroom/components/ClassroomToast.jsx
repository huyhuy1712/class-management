import { CheckCircle2, X } from 'lucide-react'

function ClassroomToast({ toast, onClose }) {
  if (!toast) return null

  return (
    <div
      role="status"
      className={`fixed right-4 top-4 z-[60] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border px-4 py-3 shadow-lg sm:right-6 sm:top-6 ${
        toast.type === 'success'
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
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

export default ClassroomToast
