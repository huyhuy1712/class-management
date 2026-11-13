export default function GradePagination({
  page,
  totalElements,
  isPlaceholderData,
  onPageChange,
  prefetchNext,
}) {
  const hasPreviousPage = page > 0 && !isPlaceholderData
  const hasNextPage = !isPlaceholderData && (page + 1) * 20 < totalElements

  return (
    <footer className="flex items-center justify-between gap-3 border-t border-slate-100 p-5 text-sm text-slate-500">
      <span>
        Trang {page + 1} · {totalElements} học sinh
      </span>
      <div className="flex gap-4">
        <button
          type="button"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(page - 1)}
          className="transition hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>
        <button
          type="button"
          disabled={!hasNextPage}
          onMouseEnter={prefetchNext}
          onFocus={prefetchNext}
          onClick={() => onPageChange(page + 1)}
          className="transition hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </footer>
  )
}
