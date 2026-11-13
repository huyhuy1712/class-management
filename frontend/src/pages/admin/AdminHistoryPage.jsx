import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  UserRound,
} from 'lucide-react'

import adminService from '../../services/adminService'

const activityTypes = [
  { value: '', label: 'Tất cả hoạt động' },
  { value: 'CLASSROOM', label: 'Lớp học' },
  { value: 'EXAM', label: 'Đề thi / bài kiểm tra' },
  { value: 'HOMEWORK', label: 'Bài tập' },
  { value: 'GRADE', label: 'Điểm số' },
  { value: 'MATERIAL', label: 'Tài liệu' },
  { value: 'ATTENDANCE', label: 'Điểm danh' },
  { value: 'LESSON', label: 'Buổi học' },
  { value: 'CLASS_FEED', label: 'Bảng tin lớp' },
  { value: 'STUDENT', label: 'Học sinh' },
]

const resourceLabels = {
  CLASSROOM: 'Lớp học',
  EXAM: 'Đề thi / bài kiểm tra',
  HOMEWORK: 'Bài tập',
  MATERIAL: 'Tài liệu',
  ATTENDANCE: 'Điểm danh',
  LESSON: 'Buổi học',
  CLASS_FEED: 'Bảng tin lớp',
  STUDENT: 'Học sinh',
}

const inputClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

function formatActivityTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Thời gian không xác định'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function AdminHistoryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [role, setRole] = useState('')
  const [userId, setUserId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(0)
  const [sortOrder, setSortOrder] = useState('newest')
  const deferredSearch = useDeferredValue(search)

  const usersQuery = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getUsers,
    staleTime: 30_000,
  })
  const users = usersQuery.data ?? []
  const visibleUsers = users.filter((user) => !role || user.role === role)

  const activityQuery = useQuery({
    queryKey: [
      'adminActivity',
      page,
      20,
      deferredSearch,
      category,
      role,
      userId,
      fromDate,
      toDate,
      sortOrder,
    ],
    queryFn: ({ signal }) => adminService.getActivity({
      page,
      size: 20,
      q: deferredSearch,
      category,
      role,
      userId: userId || undefined,
      from: fromDate,
      to: toDate,
      sort: sortOrder,
    }, { signal }),
    staleTime: 15_000,
    refetchInterval: 60_000,
  })
  const result = activityQuery.data
  const items = [...(result?.items ?? [])].sort((left, right) => {
    const timeDifference = Date.parse(left.occurredAt) - Date.parse(right.occurredAt)
    const difference = Number.isNaN(timeDifference)
      ? Number(left.id) - Number(right.id)
      : timeDifference || Number(left.id) - Number(right.id)
    return sortOrder === 'newest' ? -difference : difference
  })
  const totalPages = result?.totalPages ?? 0
  const hasFilters = Boolean(search || category || role || userId || fromDate || toDate)

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setRole('')
    setUserId('')
    setFromDate('')
    setToDate('')
    setPage(0)
  }

  const updateFilter = (setter) => (value) => {
    setter(value)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <section className="admin-history-banner">
        <div className="admin-history-banner__decoration" aria-hidden="true" />
        <div className="admin-history-banner__content">
          <div className="max-w-2xl">
            <div className="admin-history-banner__icon">
              <History size={24} />
            </div>
            <p className="admin-history-banner__eyebrow">
              Quản trị hệ thống
            </p>
            <h1 className="admin-history-banner__title">
              Lịch sử hoạt động người dùng
            </h1>
            <p className="admin-history-banner__description">
              Theo dõi hoạt động đã ghi nhận, lọc theo giáo viên, học sinh hoặc một tài khoản cụ thể.
            </p>
          </div>
          <div className="admin-history-banner__scope">
            <UserRound size={20} />
            <div>
              <p>Phạm vi</p>
              <strong>Toàn hệ thống</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Activity size={21} />}
          label="Tổng hoạt động"
          value={result?.summary?.totalActivities}
          note="Toàn bộ hoạt động đã ghi nhận"
          tone="blue"
        />
        <SummaryCard
          icon={<CalendarDays size={21} />}
          label="Trong 30 ngày qua"
          value={result?.summary?.last30Days}
          note="Trên toàn hệ thống"
          tone="emerald"
        />
        <SummaryCard
          icon={<ClipboardList size={21} />}
          label="Nhóm hoạt động"
          value={result?.summary?.categoryCount}
          note="Các loại hoạt động đã phát sinh"
          tone="violet"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nhật ký hoạt động</h2>
              <p className="mt-1 text-sm text-slate-500">
                Bộ lọc tài khoản áp dụng đồng thời với bộ lọc vai trò.
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
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowDownUp size={14} />
              {sortOrder === 'newest' ? 'Mới nhất trước' : 'Cũ nhất trước'}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label className="relative sm:col-span-2 xl:col-span-1">
              <span className="sr-only">Tìm nội dung hoạt động</span>
              <Search size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => updateFilter(setSearch)(event.target.value)}
                placeholder="Tìm nội dung hoạt động..."
                className={`${inputClassName} pl-10`}
              />
            </label>
            <label>
              <span className="sr-only">Lọc theo vai trò</span>
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value)
                  setUserId('')
                  setPage(0)
                }}
                className={inputClassName}
              >
                <option value="">Tất cả giáo viên và học sinh</option>
                <option value="TEACHER">Chỉ giáo viên</option>
                <option value="STUDENT">Chỉ học sinh</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Lọc theo tài khoản</span>
              <select
                value={userId}
                onChange={(event) => updateFilter(setUserId)(event.target.value)}
                className={inputClassName}
                disabled={usersQuery.isPending || usersQuery.isError}
              >
                <option value="">
                  {usersQuery.isPending ? 'Đang tải tài khoản...' : 'Tất cả tài khoản'}
                </option>
                {visibleUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.username} · {user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Loại hoạt động</span>
              <select
                value={category}
                onChange={(event) => updateFilter(setCategory)(event.target.value)}
                className={inputClassName}
              >
                {activityTypes.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
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
          {usersQuery.isError && (
            <p role="alert" className="text-sm text-rose-700">
              Không tải được danh sách tài khoản để lọc theo từng người dùng.
            </p>
          )}
        </div>

        {activityQuery.error ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <TriangleAlert size={25} />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Không tải được lịch sử</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Không thể tải hoạt động người dùng. Vui lòng thử lại.
            </p>
            <button
              type="button"
              onClick={() => activityQuery.refetch()}
              className="mt-5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Thử lại
            </button>
          </div>
        ) : activityQuery.isPending ? (
          <div className="flex min-h-[260px] items-center justify-center gap-3 text-sm font-medium text-slate-500">
            <LoaderCircle size={20} className="animate-spin text-blue-700" />
            Đang tải lịch sử hoạt động...
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
            <History size={34} className="text-blue-700" />
            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {hasFilters ? 'Không tìm thấy hoạt động phù hợp' : 'Chưa có hoạt động nào'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasFilters
                ? 'Hãy thử thay đổi bộ lọc hoặc khoảng thời gian.'
                : 'Các hoạt động được hệ thống ghi nhận sẽ hiển thị tại đây.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
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
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Activity size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.summary}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {resourceLabels[item.resourceType] ?? item.resourceType}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700">
                      {item.actorName || 'Tài khoản không còn tồn tại'}
                      {item.actorUsername ? ` (@${item.actorUsername})` : ''}
                      <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        {item.actorRole === 'TEACHER' ? 'Giáo viên' : item.actorRole === 'STUDENT' ? 'Học sinh' : item.actorRole || 'Không rõ vai trò'}
                      </span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <time dateTime={item.occurredAt}>{formatActivityTime(item.occurredAt)}</time>
                      {item.classId && <span className="text-slate-400">Lớp #{item.classId}</span>}
                      {item.resourceId && <span className="text-slate-400">Mã đối tượng #{item.resourceId}</span>}
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
  )
}

function SummaryCard({ icon, label, value, note, tone }) {
  const styles = {
    blue: { border: 'border-blue-100', icon: 'bg-blue-50 text-blue-700' },
    emerald: { border: 'border-emerald-100', icon: 'bg-emerald-50 text-emerald-700' },
    violet: { border: 'border-violet-100', icon: 'bg-violet-50 text-violet-700' },
  }[tone]

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${styles.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
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
