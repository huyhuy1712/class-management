import { Search } from 'lucide-react'

function ClassroomFilters({
  search,
  onSearchChange,
  statusFilters,
  selectedStatus,
  onStatusChange,
  resultCount,
  totalCount,
}) {
  return (
    <>
      <div className="mt-7 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm kiếm theo tên hoặc mã lớp..."
            className="w-full rounded-xl border border-emerald-100 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Lọc trạng thái lớp"
        >
          {statusFilters.map((filter) => {
            const isSelected = selectedStatus === filter.value

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onStatusChange(filter.value)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                  isSelected
                    ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                    : 'border-emerald-100 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {filter.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs ${
                    isSelected
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500" aria-live="polite">
          Hiển thị{' '}
          <span className="font-semibold text-[#18301D]">{resultCount}</span>{' '}
          / {totalCount} lớp
        </p>
      </div>
    </>
  )
}

export default ClassroomFilters
