import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import StudentDashboardLayout from '../../../layouts/StudentDashboardLayout'
import GradeHistory from './components/GradeHistory'
import GradeOverviewCharts from './components/GradeOverviewCharts'
import GradeSummary from './components/GradeSummary'
import GradeFilters from './components/GradeFilters'
import useStudentGrades from './hooks/useStudentGrades'
import { adaptGradeItem } from './helpers/gradeOverviewAdapter'

const initialFilters = {
  classroom: '',
  subject: '',
  from: '',
  to: '',
  search: '',
  status: '',
  order: 'newest',
}

function GradePageHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
          <BarChart3 size={28} />
        </span>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            Hành trình học tập
          </p>
          <h1 className="text-2xl font-extrabold text-[#18301D] sm:text-3xl">
            Thông tin điểm số
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Theo dõi kết quả, nhìn lại tiến bộ và tìm điều cần cải thiện.
          </p>
        </div>
      </div>
      <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
        Điểm đã được công bố
      </span>
    </header>
  )
}

function GradeQueryStatus({ query, hasData }) {
  if (query.isLoading) {
    return (
      <p role="status" className="rounded-xl bg-white p-4 text-sm text-slate-500">
        Đang tải thống kê điểm...
      </p>
    )
  }

  if (!query.isError) return null

  return (
    <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
      {hasData
        ? 'Chưa cập nhật được dữ liệu mới; đang hiển thị dữ liệu đã tải.'
        : query.errorMessage}
      <button
        type="button"
        onClick={() => query.refetch()}
        className="ml-3 underline"
      >
        Thử lại
      </button>
    </p>
  )
}

export default function StudentGradesPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(0)
  const query = useStudentGrades(filters, page)

  const rows = (query.data?.items ?? []).map(adaptGradeItem)
  const stats = query.data?.summary ?? {}
  const classrooms = query.data?.filters?.classes ?? []
  const subjects = query.data?.filters?.subjects ?? []
  const currentPage = query.isPlaceholderData
    ? page
    : query.data?.page ?? page
  const total = query.data?.totalElements ?? 0

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(0)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setPage(0)
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6 px-4 py-6 sm:px-8">
        <GradeQueryStatus query={query} hasData={Boolean(query.data)} />
        <GradePageHeader />

        <GradeFilters
          filters={filters}
          classrooms={classrooms}
          subjects={subjects}
          onChange={updateFilter}
          onReset={resetFilters}
        />

        <GradeSummary stats={stats} />

        {query.data && <GradeOverviewCharts charts={query.data.charts} />}

        <GradeHistory
          rows={rows}
          total={total}
          filters={filters}
          currentPage={currentPage}
          pageCount={Math.max(1, Math.ceil(total / 6))}
          isPlaceholderData={query.isPlaceholderData}
          prefetchNext={query.prefetchNext}
          onFilterChange={updateFilter}
          onPageChange={setPage}
        />
      </div>
    </StudentDashboardLayout>
  )
}
