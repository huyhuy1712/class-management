import FrogLoading from '../../../../utils/FrogLoading'
import { useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ClipboardCheck, FileText, Plus, Search, Clock } from 'lucide-react'
import { Tooltip } from 'antd'
import useResourceQuery from '../../../../query/useResourceQuery'
import useRoutePrefetch from '../../../../query/useRoutePrefetch'
import ExamStatusBadge from '../../exams/components/ExamStatusBadge'
import { formatExamDateTime } from '../../exams/helpers/examHelpers'

export default function AssignmentsTab() {
  const { classId } = useParams()
  const { classroom } = useOutletContext()
  const navigate = useNavigate()
  const prefetch = useRoutePrefetch()
  const query = useResourceQuery('classExams', [classId])
  const [search, setSearch] = useState('')
  const [grading, setGrading] = useState('ALL')
  const detailPath = (item) => `/teacher/exams/${item.examId}/assignments/${item.assignmentId}?classId=${classId}`
  const items = query.data ?? []
  const normalized = search.trim().toLocaleLowerCase('vi')
  const filtered = items.filter((item) => `${item.title} ${item.code}`.toLocaleLowerCase('vi').includes(normalized)
    && (grading === 'ALL' || (grading === 'PENDING' ? item.pendingGradingCount > 0
      : grading === 'GRADED' ? item.gradedCount > 0 && item.pendingGradingCount === 0
        : item.gradedCount + item.pendingGradingCount === 0)))
  return <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
    <div className="border-b border-slate-100 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FileText size={21} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-[#18301D] sm:text-xl">Danh sách đề thi</h2>
            <p className="mt-0.5 text-xs text-slate-500">Các đợt thi được giao cho lớp này</p>
          </div>
        </div>
        <button
          type="button"
          onMouseEnter={() => prefetch('/teacher/exams/create')}
          onFocus={() => prefetch('/teacher/exams/create')}
          onClick={() => navigate('/teacher/exams/create', { state: { defaultClassId: classroom.id, defaultClassName: classroom.name } })}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          Thêm đề
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Tìm đề thi"
            placeholder="Tìm theo tên hoặc mã đề thi..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
          />
        </div>
        <select
          aria-label="Trạng thái chấm bài"
          value={grading}
          onChange={(event) => setGrading(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 md:min-w-[210px]"
        >
          <option value="ALL">Tất cả trạng thái chấm</option>
          <option value="PENDING">Chờ chấm tự luận</option>
          <option value="GRADED">Đã chấm hết bài nộp</option>
          <option value="EMPTY">Chưa có bài nộp</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>Hiển thị <strong className="text-slate-700">{filtered.length}</strong> / {items.length} lần giao đề</p>
        <p className="text-slate-400">Mỗi đợt thi là một dòng riêng</p>
      </div>
      {query.isError && query.data && <p role="alert" className="mt-3 text-sm text-amber-700">Chưa cập nhật được dữ liệu mới. <button type="button" onClick={() => query.refetch()} className="underline">Thử lại</button></p>}
    </div>
    {query.isLoading ? <FrogLoading label="Đang tải đề thi..." className="p-8 text-center text-slate-500" />
      : query.errorMessage ? <div role="alert" className="p-8 text-center text-red-600">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></div>
      : filtered.length === 0 ? <p className="border-t border-slate-100 p-10 text-center text-slate-500">{items.length ? 'Không có đề thi phù hợp bộ lọc.' : 'Lớp học chưa có đề thi được giao.'}</p>
        : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm">
          <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr>{['STT', 'Đề thi', 'Trạng thái', 'Chấm bài', 'Thời gian'].map((title) => <th key={title} className="px-4 py-3.5 font-bold">{title}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{filtered.map((item, index) => <tr key={item.assignmentId} role="link" tabIndex={0} aria-label={`Xem đợt giao #${item.assignmentId}: ${item.title}`} className="cursor-pointer transition hover:bg-emerald-50/50 focus-visible:bg-emerald-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-500" onMouseEnter={() => prefetch(detailPath(item))} onFocus={() => prefetch(detailPath(item))} onClick={() => navigate(detailPath(item))} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); navigate(detailPath(item)) } }}>
            <td className="px-4 py-4"><span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600">{index + 1}</span></td>
            <td className="px-4 py-4"><Tooltip title={item.title} trigger={['hover', 'focus']}><span className="block max-w-[280px] truncate text-left font-semibold text-[#18301D]">{item.title}</span></Tooltip><p className="mt-1 text-xs text-slate-400">{item.code} · Đợt #{item.assignmentId}</p><p className="mt-1.5 text-xs font-medium text-emerald-700">{item.assignmentType === 'STUDENT' ? 'Giao riêng cho học sinh' : item.assignmentType === 'ALL' ? 'Tất cả lớp của giáo viên' : 'Giao theo lớp'}</p></td>
            <td className="px-4 py-4"><ExamStatusBadge status={item.examStatus} /><p className="mt-1.5 text-xs text-slate-500">{item.assignmentStatus === 'DRAFT' ? 'Lần giao nháp' : item.assignmentStatus === 'SCHEDULED' ? 'Đã lên lịch' : item.assignmentStatus === 'CLOSED' ? 'Đã đóng' : 'Đã giao'}</p></td>
            <td className="px-4 py-4"><p className={`mb-2 text-xs font-bold ${item.pendingGradingCount > 0 ? 'text-amber-700' : item.gradedCount > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>{item.pendingGradingCount > 0 ? 'Chờ chấm tự luận' : item.gradedCount > 0 ? 'Đã chấm hết bài nộp' : 'Chưa có bài nộp'}</p><div className="flex flex-wrap gap-1.5"><span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"><ClipboardCheck size={14} />{item.gradedCount}</span><span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"><Clock size={14} />{item.pendingGradingCount}</span></div></td>
            <td className="px-4 py-4 text-slate-500"><p className="font-medium text-slate-600">{item.timeLimit} phút</p><p className="mt-1 text-xs">Mở: {item.openTime ? formatExamDateTime(item.openTime) : 'Không giới hạn'}</p><p className="mt-1 text-xs">Đóng: {item.closeTime ? formatExamDateTime(item.closeTime) : 'Không giới hạn'}</p></td>
          </tr>)}</tbody>
        </table></div>}
  </section>
}
