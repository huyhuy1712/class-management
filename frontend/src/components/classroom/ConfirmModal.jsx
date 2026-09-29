import { AlertTriangle } from 'lucide-react'

function ConfirmModal({
  open,
  title,
  description,
  confirmText,
  loading = false,
  danger = false,
  onClose,
  onConfirm,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            danger
              ? 'bg-red-50 text-red-500'
              : 'bg-orange-50 text-orange-500'
          }`}
        >
          <AlertTriangle size={23} />
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-lg font-bold text-[#18301D]">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {description}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal