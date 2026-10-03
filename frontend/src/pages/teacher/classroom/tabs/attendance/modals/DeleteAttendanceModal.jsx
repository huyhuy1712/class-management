import { AlertTriangle, LoaderCircle } from 'lucide-react'
import { formatDate } from '../../../../../../utils/dateUtils'

function DeleteAttendanceModal({
  attendance,
  deleting,
  error,
  onClose,
  onConfirm,
}) {
  if (!attendance) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-attendance-title"
        className="w-full max-w-lg rounded-[20px] bg-white px-7 py-8 shadow-2xl sm:px-8"
      >
        <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle size={28} strokeWidth={2} />
        </div>

        <div className="mt-6 text-center">
          <h3
            id="delete-attendance-title"
            className="text-xl font-bold text-[#18301D] sm:text-[22px]"
          >
            Xóa điểm danh?
          </h3>
          <p className="mt-3 text-base leading-7 text-slate-500">
            Bạn có chắc chắn muốn xóa điểm danh của{' '}
            <span className="font-medium text-slate-600">
              {attendance.fullName}
            </span>{' '}
            vào ngày{' '}
            <span className="font-medium text-slate-600">
              {formatDate(attendance.date)}
            </span>
            ?
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600"
          >
            {error}
          </div>
        )}

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="min-h-14 rounded-2xl border border-slate-200 px-4 py-3 text-base font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#ff2936] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#ed1c2a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Đang xóa...
              </>
            ) : (
              'Xóa điểm danh'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteAttendanceModal
