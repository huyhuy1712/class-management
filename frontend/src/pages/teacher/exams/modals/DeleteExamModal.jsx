import {
  AlertTriangle,
  LoaderCircle,
  X,
} from 'lucide-react'

function DeleteExamModal({
  open,
  exam,
  force = false,
  loading = false,
  error = '',
  onClose,
  onConfirm,
}) {
  if (!open || !exam) return null

  const handleClose = () => {
    if (loading) return
    onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          handleClose()
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl">

        {/* HEADER */}
        <div className="relative px-6 pb-2 pt-7">
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="absolute right-4 top-4 cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                force
                  ? 'bg-red-50 text-red-500'
                  : 'bg-red-50 text-red-500'
              }`}
            >
              <AlertTriangle size={27} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#18301D]">
              {force
                ? 'Xóa đề thi và bài làm?'
                : 'Xóa đề thi'}
            </h2>

            {force ? (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Đề thi{' '}
                <span className="font-semibold text-slate-700">
                  "{exam.title}"
                </span>{' '}
                đã có học sinh làm bài.
                Nếu tiếp tục, toàn bộ bài làm và kết quả
                liên quan cũng sẽ bị xóa vĩnh viễn.
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Bạn có chắc chắn muốn xóa vĩnh viễn đề thi{' '}
                <span className="font-semibold text-slate-700">
                  "{exam.title}"
                </span>
                ? Hành động này không thể hoàn tác.
              </p>
            )}

            {force && (
              <div className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-left">
                <p className="text-sm font-semibold text-red-600">
                  Cảnh báo
                </p>

                <p className="mt-1 text-xs leading-5 text-red-500">
                  Toàn bộ bài làm và kết quả của học sinh
                  thuộc đề thi này sẽ bị xóa.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-600">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ACTION */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-6 pt-5">
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            )}

            {loading
              ? 'Đang xóa...'
              : force
                ? 'Xóa tất cả'
                : 'Xóa đề'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteExamModal