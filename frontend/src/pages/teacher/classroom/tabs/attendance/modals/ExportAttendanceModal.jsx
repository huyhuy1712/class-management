import {
  AlertCircle,
  CalendarDays,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  X,
} from 'lucide-react'
import { useRef } from 'react'
import { formatDate } from '../../../../../../utils/dateUtils'

function ExportAttendanceModal({
  open,
  date,
  exporting,
  error,
  onDateChange,
  onClose,
  onExport,
}) {
  const datePickerRef = useRef(null)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !exporting
        ) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FileSpreadsheet size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#18301D]">
                Xuất điểm danh Excel
              </h2>

              <p className="mt-0.5 text-sm text-slate-400">
                Chọn ngày cần xuất danh sách điểm danh
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={exporting}
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Ngày điểm danh
          </label>

          <div className="relative">
            <div className="flex w-full items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50">
              <div className="flex flex-1 items-center gap-3 px-4 py-3">
                <CalendarDays
                  size={18}
                  className="shrink-0 text-emerald-600"
                />

                <span
                  className={`text-sm ${
                    date
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {date
                    ? formatDate(date)
                    : 'Chọn ngày điểm danh'}
                </span>
              </div>

              <button
                type="button"
                disabled={exporting}
                onClick={() => {
                  if (datePickerRef.current?.showPicker) {
                    datePickerRef.current.showPicker()
                  } else {
                    datePickerRef.current?.click()
                  }
                }}
                className="flex h-11 w-11 items-center justify-center border-l border-slate-100 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed"
              >
                <CalendarDays size={18} />
              </button>
            </div>

            <input
              ref={datePickerRef}
              type="date"
              value={date}
              disabled={exporting}
              onChange={(event) =>
                onDateChange(event.target.value)
              }
              className="pointer-events-none absolute h-px w-px opacity-0"
              tabIndex={-1}
            />
          </div>

          {/* INFO */}
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Nội dung file Excel
                </p>

                <div className="mt-2 space-y-1 text-sm leading-5 text-emerald-700">
                  <p>• Mã học sinh</p>
                  <p>• Họ và tên</p>
                  <p>• Trạng thái điểm danh</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            Học sinh chưa có bản ghi điểm danh trong ngày
            được chọn sẽ được xuất với trạng thái ABSENT.
          </p>

          {/* ERROR */}
          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-500"
              />

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Không thể xuất file
                </p>

                <p className="mt-1 text-sm leading-5 text-red-600">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            disabled={exporting}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={exporting || !date}
            onClick={onExport}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
                Đang xuất...
              </>
            ) : (
              <>
                <Download size={17} />
                Xuất Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportAttendanceModal