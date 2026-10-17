import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronDown,
  GraduationCap,
  Search,
} from 'lucide-react'
import useRoutePrefetch from '../../../../query/useRoutePrefetch'
import useClassGradebook from '../hooks/useClassGradebook'
import defaultAvatar from '../../../../assets/images/avatar_default.png'
import { formatExamDateTime } from '../../exams/helpers/examHelpers'

const number = (value) => value == null ? '—' : Number(Number(value).toFixed(3))
function GradeCell({ cell, column, classId }) {
  const prefetch = useRoutePrefetch()
  if (!cell?.assigned) return <span className="text-xs text-slate-400">Không được giao</span>
  const final = cell.status === 'GRADED'
  const label = final ? `${number(cell.totalScore)}/${number(column.maxScore)}` : cell.status === 'SUBMITTED' ? 'Chờ chấm' : cell.status === 'IN_PROGRESS' ? 'Đang làm' : 'Chưa làm'
  const tone = final ? Number(cell.scoreOnTen) < 5 ? 'text-red-600' : 'text-emerald-700' : cell.status === 'SUBMITTED' ? 'text-amber-600' : 'text-slate-400'
  const path = `/teacher/exams/${column.examId}/assignments/${column.assignmentId}/attempts/${cell.attemptId}?classId=${classId}`
  return cell.attemptId && ['GRADED', 'SUBMITTED'].includes(cell.status)
    ? <Link title="Xem bài làm" to={path} onMouseEnter={() => prefetch(path)} onFocus={() => prefetch(path)} className={`font-semibold hover:underline ${tone}`}>{label}</Link>
    : <span className={`text-xs ${tone}`}>{label}</span>
}

export default function GradesTab() {
  const { classId } = useParams()
  const prefetch = useRoutePrefetch()
  const [filters, setFilters] = useState({ page: 0, q: '' })
  const query = useClassGradebook(classId, filters)
  const change = (name, value) => setFilters((current) => ({ ...current, [name]: value, page: name === 'page' ? value : 0 }))
  const data = query.data
  const [sort, setSort] = useState('desc')
  const rows = useMemo(() => [...(data?.items ?? [])].sort((a, b) => {
    if (a.averageScoreOnTen == null) return b.averageScoreOnTen == null ? 0 : 1
    if (b.averageScoreOnTen == null) return -1
    return (Number(a.averageScoreOnTen) - Number(b.averageScoreOnTen)) * (sort === 'asc' ? 1 : -1)
  }), [data?.items, sort])
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
    <header className="p-5 sm:p-6"><h2 className="flex items-center gap-3 text-xl font-bold text-[#18301D]"><GraduationCap className="text-emerald-600" />Bảng điểm {data && <span className="text-sm font-normal text-slate-500">({data.totalElements} học sinh)</span>}</h2>
      <p className="mt-2 text-xs text-slate-500">Mỗi đợt giao là một cột điểm. Trung bình quy đổi thang 10, chỉ tính bài đã chấm với trọng số bằng nhau. Sắp xếp trong trang hiện tại; học sinh chưa có điểm luôn ở cuối.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <span className="relative block sm:w-64 sm:shrink-0">
          {sort === 'desc' ? (
            <ArrowDownWideNarrow
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white"
            />
          ) : (
            <ArrowUpWideNarrow
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white"
            />
          )}
          <select
            aria-label="Sắp xếp điểm trung bình"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-emerald-600 bg-gradient-to-r from-[#126b3c] to-[#20a84e] pl-10 pr-10 text-sm font-semibold text-white shadow-sm transition hover:from-[#105c34] hover:to-[#1b9847] focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            <option value="desc" className="bg-white text-slate-800">Mới tới cũ</option>
            <option value="asc" className="bg-white text-slate-800">Cũ tới mới</option>
          </select>
          <ChevronDown
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
          />
        </span>

        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-3.5 text-slate-400"
          />
          <input
            aria-label="Tìm học sinh"
            value={filters.q}
            onChange={(event) => change('q', event.target.value)}
            maxLength={200}
            placeholder="Tên, mã học sinh, email hoặc số điện thoại..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-400"
          />
        </div>
      </div>
    </header>
    {query.isError && <p role="alert" className="px-6 py-3 text-sm text-red-600">{data ? 'Chưa cập nhật được bảng điểm; đang hiển thị dữ liệu đã tải.' : query.errorMessage}<button onClick={() => query.refetch()} className="ml-2 underline">Thử lại</button></p>}
    {query.isLoading ? <p role="status" className="p-10 text-center text-slate-500">Đang tải bảng điểm...</p> : data && <>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="sticky left-0 z-10 min-w-[240px] bg-slate-50 p-4">Họ và tên</th><th className="min-w-[120px] border-l border-slate-200 p-4">Mã học sinh</th>{data.columns.map((column) => <th key={column.assignmentId} className="min-w-[180px] max-w-[230px] border-l border-slate-200 p-4"><p title={column.title} className="line-clamp-2">{column.title}</p><p className="mt-1 text-xs font-normal text-slate-400">{column.code} · Đợt #{column.assignmentId}</p></th>)}<th className="min-w-[150px] border-l border-slate-200 p-4 text-center">Trung bình /10 {sort === 'asc' ? '↑' : '↓'}</th></tr></thead>
        <tbody>{rows.map((student) => { const cells = new Map(student.cells.map((cell) => [String(cell.assignmentId), cell])); return <tr key={student.studentId} className="border-t border-slate-200"><td className="sticky left-0 z-10 bg-white p-4"><div className="flex items-center gap-3"><img src={student.avatarUrl || defaultAvatar} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultAvatar }} className="h-11 w-11 shrink-0 rounded-full object-cover" /><div><Link to={`/teacher/classes/${classId}/students/${student.studentId}`} onMouseEnter={() => prefetch(`/teacher/classes/${classId}/students/${student.studentId}`)} onFocus={() => prefetch(`/teacher/classes/${classId}/students/${student.studentId}`)} className="font-bold text-slate-800 hover:text-emerald-700">{student.fullName}</Link><p className="mt-1 text-xs text-slate-400">Tham gia: {student.joinedAt ? formatExamDateTime(student.joinedAt) : '—'}</p></div></div></td><td className="border-l border-slate-100 p-4 text-slate-500">{student.studentCode || '—'}</td>{data.columns.map((column) => <td key={column.assignmentId} className="border-l border-slate-100 p-4 text-center"><GradeCell cell={cells.get(String(column.assignmentId))} column={column} classId={classId} /></td>)}<td className={`border-l border-slate-100 p-4 text-center font-bold ${student.averageScoreOnTen == null ? 'text-slate-400' : student.averageScoreOnTen < 5 ? 'text-red-600' : 'text-emerald-700'}`}>{number(student.averageScoreOnTen)}</td></tr> })}</tbody></table></div>
      {!data.items.length && <p className="p-10 text-center text-slate-500">Không có học sinh phù hợp.</p>}
      {!data.columns.length && data.items.length > 0 && <p className="px-6 py-3 text-sm text-slate-500">Chưa có đợt giao trong phạm vi môn học đã chọn.</p>}
      <footer className="flex items-center justify-between gap-3 border-t border-slate-100 p-5 text-sm text-slate-500"><span>Trang {filters.page + 1} · {data.totalElements} học sinh</span><div className="flex gap-4"><button disabled={filters.page === 0 || query.isPlaceholderData} onClick={() => change('page', filters.page - 1)} className="disabled:opacity-40">Trước</button><button disabled={query.isPlaceholderData || (filters.page + 1) * 20 >= data.totalElements} onMouseEnter={query.prefetchNext} onFocus={query.prefetchNext} onClick={() => change('page', filters.page + 1)} className="disabled:opacity-40">Sau</button></div></footer>
    </>}
  </section>
}
