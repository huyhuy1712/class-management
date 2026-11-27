import { ArrowLeft, ArrowRight } from 'lucide-react'

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  if (currentPage <= 4) {
    ;[2, 3, 4, 5].forEach((page) => pages.add(page))
  }
  if (currentPage >= totalPages - 3) {
    ;[totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1]
      .forEach((page) => pages.add(page))
  }

  const sortedPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
  return sortedPages.reduce((visible, page, index) => {
    if (index > 0) {
      const gap = page - sortedPages[index - 1]
      if (gap === 2) visible.push(sortedPages[index - 1] + 1)
      else if (gap > 2) visible.push('ellipsis')
    }
    visible.push(page)
    return visible
  }, [])
}

export default function ActivityPagination({
  page,
  totalPages,
  totalElements,
  isFetching,
  onPageChange,
  itemLabel = 'hoạt động',
  color = 'blue',
}) {
  const currentPage = page + 1
  const lastPage = Math.max(totalPages, 1)
  const activeColors = color === 'emerald'
    ? 'border-emerald-700 bg-emerald-700 text-white'
    : 'border-blue-700 bg-blue-700 text-white'

  return (
    <nav
      aria-label="Phân trang lịch sử"
      className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <p className="text-sm text-slate-500">
        {totalElements.toLocaleString('vi-VN')} {itemLabel} phù hợp · Trang {currentPage}/{lastPage}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={page === 0 || isFetching}
          onClick={() => onPageChange(page - 1)}
          aria-label="Trang trước"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={16} /> Trước
        </button>
        {getVisiblePages(currentPage, lastPage).map((pageNumber, index) => (
          pageNumber === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1.5 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={pageNumber}
              type="button"
              disabled={isFetching}
              onClick={() => onPageChange(pageNumber - 1)}
              aria-label={`Trang ${pageNumber}`}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
              className={`h-9 min-w-9 rounded-lg border px-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                pageNumber === currentPage
                  ? activeColors
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNumber}
            </button>
          )
        ))}
        <button
          type="button"
          disabled={page + 1 >= totalPages || isFetching}
          onClick={() => onPageChange(page + 1)}
          aria-label="Trang sau"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau <ArrowRight size={16} />
        </button>
      </div>
    </nav>
  )
}
