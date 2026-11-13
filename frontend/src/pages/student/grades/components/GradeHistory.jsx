import GradeHistoryFilters from './GradeHistoryFilters'
import GradeHistoryPagination from './GradeHistoryPagination'
import GradeHistoryTable from './GradeHistoryTable'

export default function GradeHistory({
  rows,
  total,
  filters,
  currentPage,
  pageCount,
  isPlaceholderData,
  prefetchNext,
  onFilterChange,
  onPageChange,
}) {
  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#18301D]">
            Lịch sử từng lượt làm
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Kết quả bài làm theo dữ liệu hiện tại của từng đợt giao
          </p>
        </div>
        <span className="text-xs text-slate-500">{total} lượt phù hợp</span>
      </div>

      <GradeHistoryFilters filters={filters} onChange={onFilterChange} />
      <GradeHistoryTable rows={rows} />

      {!isPlaceholderData && !rows.length && (
        <p className="py-10 text-center text-slate-400">
          Không có lượt làm phù hợp bộ lọc.
        </p>
      )}

      <GradeHistoryPagination
        currentPage={currentPage}
        pageCount={pageCount}
        total={total}
        isPlaceholderData={isPlaceholderData}
        onPageChange={onPageChange}
        prefetchNext={prefetchNext}
      />
    </section>
  )
}
