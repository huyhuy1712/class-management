export default function GradeHistoryPagination({
  currentPage,
  pageCount,
  total,
  isPlaceholderData,
  onPageChange,
  prefetchNext,
}) {
  return (
    <div className="mt-5 flex justify-end gap-3 text-sm text-slate-500">
      <button
        type="button"
        disabled={!currentPage || isPlaceholderData}
        onClick={() => onPageChange(currentPage - 1)}
        className="transition hover:text-emerald-700 disabled:opacity-40"
      >
        Trước
      </button>
      <span>
        Trang {currentPage + 1} / {pageCount}
      </span>
      <button
        type="button"
        disabled={isPlaceholderData || (currentPage + 1) * 6 >= total}
        onMouseEnter={prefetchNext}
        onFocus={prefetchNext}
        onClick={() => onPageChange(currentPage + 1)}
        className="transition hover:text-emerald-700 disabled:opacity-40"
      >
        Sau
      </button>
    </div>
  )
}
