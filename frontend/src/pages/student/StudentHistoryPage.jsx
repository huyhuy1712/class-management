import { useDeferredValue, useState } from 'react'
import {
  Activity,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  History,
  LoaderCircle,
  Search,
  TriangleAlert,
} from 'lucide-react'

import StudentDashboardLayout from '../../layouts/StudentDashboardLayout'
import useResourceQuery from '../../query/useResourceQuery'

const activityTypes = [
  { value: 'all', label: 'Tất cả hoạt động' },
  { value: 'CLASSROOM', label: 'Lớp học' },
  { value: 'EXAM', label: 'Bài kiểm tra' },
  { value: 'HOMEWORK', label: 'Bài tập' },
  { value: 'ATTENDANCE', label: 'Điểm danh' },
  { value: 'CLASS_FEED', label: 'Bảng tin lớp' },
]

const resourceLabels = {
  CLASSROOM: 'Lớp học',
  EXAM: 'Bài kiểm tra',
  HOMEWORK: 'Bài tập',
  ATTENDANCE: 'Điểm danh',
  CLASS_FEED: 'Bảng tin lớp',
}

const inputClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'

function formatActivityTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Thời gian không xác định'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function StudentHistoryPage() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(0)
  const [sortOrder, setSortOrder] = useState('newest')
  const deferredSearch = useDeferredValue(search)
  const activityQuery = useResourceQuery('studentActivity', [
    page,
    20,
    deferredSearch,
    type === 'all' ? '' : type,
    fromDate,
    toDate,
    sortOrder,
  ], { errorMessage: 'Không thể tải lịch sử hoạt động. Vui lòng thử lại.' })
  const result = activityQuery.data
  const items = [...(result?.items ?? [])].sort((left, right) => {
    const timeDifference = Date.parse(left.occurredAt) - Date.parse(right.occurredAt)
    const difference = Number.isNaN(timeDifference)
      ? Number(left.id) - Number(right.id)
      : timeDifference || Number(left.id) - Number(right.id)
    return sortOrder === 'newest' ? -difference : difference
  })
  const summary = result?.summary
  const totalPages = result?.totalPages ?? 0
  const hasFilters = Boolean(search || type !== 'all' || fromDate || toDate)

  const updateFilter = (setter) => (value) => {
    setter(value)
    setPage(0)
  }

  const clearFilters = () => {
    setSearch('')
    setType('all')
    setFromDate('')
    setToDate('')
    setPage(0)
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#126b3c] via-[#168447] to-[#20a84e] p-6 text-white shadow-lg shadow-emerald-900/10 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[36px] border-white/[0.07]" />
          <div className="relative max-w-2xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <History size={24} />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
              Không gian học sinh
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Lịch sử hoạt động
            </h1>
            <p className="mt-2 text-sm leading-6 text-emerald-50/85 sm:text-base">
              Xem lại các bài kiểm tra, bài tập, lần điểm danh và tương tác của bạn trong lớp.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Activity size={21} />}
            label="Tổng hoạt động"
            value={summary?.totalActivities}
            note="Tổng số thao tác được ghi nhận"
            color="emerald"
          />
          <SummaryCard
            icon={<CalendarDays size={21} />}
            label="Trong 30 ngày qua"
            value={summary?.last30Days}
            note="Hoạt động trong 30 ngày gần nhất"
            color="blue"
          />
          <SummaryCard
            icon={<ClipboardList size={21} />}
            label="Nhóm hoạt động"
            value={summary?.categoryCount}
            note="Nhóm thao tác đã được sử dụng"
            color="violet"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#18301D]">Nhật ký hoạt động</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tìm và lọc hoạt động theo thời gian hoặc loại thao tác.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSortOrder((current) => current === 'newest' ? 'oldest' : 'newest')
                  setPage(0)
                }}
                aria-pressed={sortOrder === 'oldest'}
                aria-label={`Sắp xếp ${sortOrder === 'newest' ? 'cũ nhất trước' : 'mới nhất trước'}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <ArrowDownUp size={14} />
                {sortOrder === 'newest' ? 'Mới nhất trước' : 'Cũ nhất trước'}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="relative sm:col-span-2 xl:col-span-1">
                <span className="sr-only">Tìm hoạt động</span>
                <Search size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => updateFilter(setSearch)(event.target.value)}
                  placeholder="Tìm trong lịch sử..."
                  className={`${inputClassName} pl-10`}
                />
              </label>
              <label>
                <span className="sr-only">Loại hoạt động</span>
                <select
                  value={type}
                  onChange={(event) => updateFilter(setType)(event.target.value)}
                  className={inputClassName}
                >
                  {activityTypes.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Từ ngày</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => updateFilter(setFromDate)(event.target.value)}
                  className={inputClassName}
                  aria-label="Từ ngày"
                />
              </label>
              <label>
                <span className="sr-only">Đến ngày</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => updateFilter(setToDate)(event.target.value)}
                  className={inputClassName}
                  aria-label="Đến ngày"
                />
              </label>
            </div>
          </div>

          {activityQuery.errorMessage ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <TriangleAlert size={25} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-[#18301D]">Không tải được lịch sử</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">{activityQuery.errorMessage}</p>
              <button
                type="button"
                onClick={() => activityQuery.refetch()}
                className="mt-5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Thử lại
              </button>
            </div>
          ) : activityQuery.isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center gap-3 text-sm font-medium text-slate-500">
              <LoaderCircle size={20} className="animate-spin text-emerald-700" />
              Đang tải lịch sử hoạt động...
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
              <History size={34} className="text-emerald-700" />
              <h3 className="mt-5 text-lg font-bold text-[#18301D]">
                {hasFilters ? 'Không tìm thấy hoạt động phù hợp' : 'Chưa có hoạt động nào'}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasFilters
                  ? 'Hãy thử thay đổi từ khóa, loại hoạt động hoặc khoảng thời gian.'
                  : 'Các thao tác học tập của bạn sẽ được ghi nhận và hiển thị tại đây.'}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              <ol className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 px-5 py-5 sm:px-6">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Activity size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#18301D]">{item.summary}</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {resourceLabels[item.resourceType] ?? item.resourceType}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <time dateTime={item.occurredAt}>{formatActivityTime(item.occurredAt)}</time>
                        {item.classId && <span className="text-slate-400">Lớp #{item.classId}</span>}
                        {item.resourceId && (
                          <span className="text-slate-400">Mã đối tượng #{item.resourceId}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-slate-500">
                  {result.totalElements.toLocaleString('vi-VN')} hoạt động phù hợp · Trang {page + 1}/{Math.max(totalPages, 1)}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 0 || activityQuery.isFetching}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft size={16} /> Trước
                  </button>
                  <button
                    type="button"
                    disabled={page + 1 >= totalPages || activityQuery.isFetching}
                    onClick={() => setPage((current) => current + 1)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </StudentDashboardLayout>
  )
}

function SummaryCard({ icon, label, value, note, color }) {
  const styles = {
    emerald: {
      border: 'border-emerald-100',
      icon: 'bg-emerald-50 text-emerald-700',
    },
    blue: {
      border: 'border-blue-100',
      icon: 'bg-blue-50 text-blue-700',
    },
    violet: {
      border: 'border-violet-100',
      icon: 'bg-violet-50 text-violet-700',
    },
  }[color]

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${styles.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-[#18301D]">
            {value === undefined ? '—' : value.toLocaleString('vi-VN')}
          </p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles.icon}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400">{note}</p>
    </div>
  )
}
