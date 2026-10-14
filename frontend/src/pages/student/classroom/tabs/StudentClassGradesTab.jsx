import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tooltip } from 'antd'
import { Eye, FileText } from 'lucide-react'
import useResourceQuery from '../../../../query/useResourceQuery'
import useRoutePrefetch from '../../../../query/useRoutePrefetch'
import { filterStudentExams } from '../../exams/helpers/studentExamHelpers'
import { formatExamDateTime } from '../../../teacher/exams/helpers/examHelpers'

function GradeRow({ exam, number }) {
  const finished = exam.attemptId != null && ['SUBMITTED', 'GRADED'].includes(exam.attemptStatus)
  const result = useResourceQuery('examAttemptResult', [exam.attemptId], { enabled: finished, staleTime: 0, refetchInterval: 30_000 })
  const prefetch = useRoutePrefetch()
  const data = finished ? result.data : undefined
  const target = finished ? `/student/exam-attempts/${exam.attemptId}/result` : `/student/exams/${exam.assignmentId}`
  const labels = { NOT_STARTED: 'Chưa làm', IN_PROGRESS: 'Đang làm', SUBMITTED: 'Chờ chấm tự luận', GRADED: 'Đã chấm' }
  return <tr className="border-t border-slate-100 hover:bg-emerald-50/30">
    <td className="px-4 py-4">{number}</td>
    <td className="px-4 py-4"><Tooltip title={exam.title} trigger={['hover', 'focus']}><Link to={target} onMouseEnter={() => prefetch(target)} onFocus={() => prefetch(target)} className="block max-w-[270px] truncate font-semibold text-[#18301D] hover:text-emerald-700">{exam.title}</Link></Tooltip><p className="mt-1 text-xs text-slate-400">{exam.code} · Đợt #{exam.assignmentId}</p><p className="mt-1 text-xs text-emerald-700">{exam.assignmentType === 'STUDENT' ? 'Giao riêng cho bạn' : exam.assignmentType === 'ALL' ? 'Tất cả lớp của giáo viên' : 'Giao theo lớp'}</p></td>
    <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${exam.attemptStatus === 'GRADED' ? 'bg-emerald-50 text-emerald-700' : exam.attemptStatus === 'SUBMITTED' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{labels[exam.attemptStatus] ?? 'Chưa làm'}</span><p className="mt-2 text-xs text-slate-500">Đã làm {exam.attemptsUsed} lượt</p></td>
    <td className="px-4 py-4">{!finished ? '—' : result.isLoading ? <span className="text-xs text-slate-400">Đang lấy điểm...</span> : result.errorMessage ? <button type="button" onClick={() => result.refetch()} className="text-xs text-red-600">Không tải được điểm · Thử lại</button> : data?.scoreVisible && data.totalScore != null ? <><strong className="text-lg text-emerald-700">{data.totalScore}</strong>{!data.isFinal && <p className="text-xs text-amber-700">Điểm tạm tính</p>}</> : <span className="text-xs text-slate-500">Chưa được phép xem điểm</span>}</td>
    <td className="px-4 py-4 text-xs text-slate-500"><p>{exam.timeLimit} phút</p><p className="mt-1">{data?.submittedAt ? `Nộp: ${formatExamDateTime(data.submittedAt)}` : `Mở: ${exam.openTime ? formatExamDateTime(exam.openTime) : 'Không giới hạn'}`}</p><p className="mt-1">Đóng: {exam.closeTime ? formatExamDateTime(exam.closeTime) : 'Không giới hạn'}</p></td>
    <td className="px-4 py-4"><Link to={target} aria-label={`Xem ${finished ? 'kết quả' : 'đợt giao'} ${exam.title}`} onMouseEnter={() => prefetch(target)} onFocus={() => prefetch(target)} className="inline-flex rounded-xl border border-emerald-200 p-2.5 text-emerald-600 hover:bg-emerald-50"><Eye size={18} /></Link></td>
  </tr>
}

export default function StudentClassGradesTab({ classId }) {
  const query = useResourceQuery('studentExams', [])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const items = filterStudentExams(query.data?.items ?? [], { classId, search, order: 'SERVER' })
  const currentPage = Math.min(page, Math.max(0, Math.ceil(items.length / 12) - 1))
  const visible = items.slice(currentPage * 12, (currentPage + 1) * 12)
  return <div>
    <h2 className="flex items-center gap-3 text-xl font-bold text-[#18301D]"><FileText size={24} className="text-emerald-600" />Điểm số</h2>
    <p className="mt-2 text-sm text-slate-500">Điểm của lượt làm hiện tại trong từng đợt giao đề của lớp.</p>
    <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder="Tìm theo tên hoặc mã đề thi..." aria-label="Tìm điểm bài thi" className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-emerald-400" />
    {query.isError && query.data && <p role="alert" className="mt-3 text-sm text-amber-700">Chưa cập nhật được dữ liệu mới. <button type="button" onClick={() => query.refetch()} className="underline">Thử lại</button></p>}
    {query.isLoading ? <p role="status" className="py-10 text-center text-slate-500">Đang tải các đợt giao đề...</p> : query.errorMessage ? <p role="alert" className="py-8 text-red-600">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></p> : <>
      <p className="my-4 text-xs text-slate-500">{items.length} đợt giao đề phù hợp</p>
      {visible.length ? <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[800px] text-sm"><thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr>{['STT', 'Đề thi', 'Trạng thái', 'Điểm', 'Thời gian', 'Hành động'].map((label) => <th key={label} className="px-4 py-3.5">{label}</th>)}</tr></thead><tbody>{visible.map((exam, index) => <GradeRow key={exam.assignmentId} exam={exam} number={currentPage * 12 + index + 1} />)}</tbody></table></div> : <p className="py-10 text-center text-slate-400">{search ? 'Không có đề thi phù hợp tìm kiếm.' : 'Chưa có đợt giao đề nào trong lớp này.'}</p>}
      <div className="mt-4 flex items-center justify-end gap-3 text-sm"><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Trước</button><span>Trang {currentPage + 1}</span><button type="button" disabled={(currentPage + 1) * 12 >= items.length} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Sau</button></div>
    </>}
  </div>
}
