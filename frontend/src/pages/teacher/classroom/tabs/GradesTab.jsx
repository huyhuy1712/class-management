import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import useRoutePrefetch from '../../../../query/useRoutePrefetch'
import useClassGradebook from '../hooks/useClassGradebook'
import GradeFilters from '../components/grades/GradeFilters'
import GradePagination from '../components/grades/GradePagination'
import GradeTable from '../components/grades/GradeTable'

export default function GradesTab() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const prefetch = useRoutePrefetch()
  const [filters, setFilters] = useState({ page: 0, q: '' })
  const [sort, setSort] = useState('desc')
  const query = useClassGradebook(classId, filters)
  const data = query.data

  const rows = useMemo(
    () =>
      [...(data?.items ?? [])].sort((first, second) => {
        if (first.averageScoreOnTen == null) {
          return second.averageScoreOnTen == null ? 0 : 1
        }
        if (second.averageScoreOnTen == null) return -1

        const scoreDifference =
          Number(first.averageScoreOnTen) - Number(second.averageScoreOnTen)
        return scoreDifference * (sort === 'asc' ? 1 : -1)
      }),
    [data?.items, sort],
  )

  const updateFilter = (name, value) => {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: name === 'page' ? value : 0,
    }))
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <header className="p-5 sm:p-6">
        <h2 className="flex items-center gap-3 text-xl font-bold text-[#18301D]">
          <GraduationCap className="text-emerald-600" />
          Bảng điểm
        </h2>
        <GradeFilters
          sort={sort}
          onSortChange={setSort}
          search={filters.q}
          onSearchChange={(value) => updateFilter('q', value)}
        />
      </header>

      {query.isError && (
        <p role="alert" className="px-6 py-3 text-sm text-red-600">
          {data
            ? 'Chưa cập nhật được bảng điểm; đang hiển thị dữ liệu đã tải.'
            : query.errorMessage}
          <button
            type="button"
            onClick={() => query.refetch()}
            className="ml-2 underline"
          >
            Thử lại
          </button>
        </p>
      )}

      {query.isLoading ? (
        <p role="status" className="p-10 text-center text-slate-500">
          Đang tải bảng điểm...
        </p>
      ) : (
        data && (
          <>
            <GradeTable
              rows={rows}
              columns={data.columns}
              sort={sort}
              classId={classId}
              prefetch={prefetch}
              navigate={navigate}
            />

            {!data.items.length && (
              <p className="p-10 text-center text-slate-500">
                Không có học sinh phù hợp.
              </p>
            )}
            {!data.columns.length && data.items.length > 0 && (
              <p className="px-6 py-3 text-sm text-slate-500">
                Chưa có đợt giao trong phạm vi môn học đã chọn.
              </p>
            )}

            <GradePagination
              page={filters.page}
              totalElements={data.totalElements}
              isPlaceholderData={query.isPlaceholderData}
              onPageChange={(page) => updateFilter('page', page)}
              prefetchNext={query.prefetchNext}
            />
          </>
        )
      )}
    </section>
  )
}
