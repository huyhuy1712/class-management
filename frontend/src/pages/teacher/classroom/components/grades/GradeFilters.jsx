import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronDown,
  Search,
} from 'lucide-react'

export default function GradeFilters({
  sort,
  onSortChange,
  search,
  onSearchChange,
}) {
  const SortIcon = sort === 'desc' ? ArrowDownWideNarrow : ArrowUpWideNarrow

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      <label className="relative block sm:w-64 sm:shrink-0">
        <span className="sr-only">Sắp xếp điểm trung bình</span>
        <SortIcon
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700"
        />
        <select
          aria-label="Sắp xếp điểm trung bình"
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
        >
          <option value="desc">Điểm cao đến thấp</option>
          <option value="asc">Điểm thấp đến cao</option>
        </select>
        <ChevronDown
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </label>

      <label className="relative flex-1">
        <span className="sr-only">Tìm học sinh</span>
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
        />
        <input
          aria-label="Tìm học sinh"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          maxLength={200}
          placeholder="Tên, mã học sinh, email hoặc số điện thoại..."
          className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
        />
      </label>
    </div>
  )
}
