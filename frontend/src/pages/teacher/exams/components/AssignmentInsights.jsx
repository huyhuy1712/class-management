import AssignmentLeaderboard from './AssignmentLeaderboard'
import useResourceQuery from '../../../../query/useResourceQuery'
import { buildAssignmentGradeExport } from '../helpers/assignmentGradeExport'
import { attemptLabels } from '../helpers/assignmentAttemptHelpers'
import { GradeDonut } from '../../../student/grades/components/GradeOverviewCharts'

export default function AssignmentInsights({ assignmentId, classId, maxScore, tab, onView }) {
  const query = useResourceQuery('teacherAssignmentExport', [assignmentId, classId])
  if (query.isLoading) return <p role="status" className="p-6">Đang tải {tab === 'statistics' ? 'thống kê' : 'bảng xếp hạng'}...</p>
  if (!query.data) return <p role="alert" className="p-6 text-red-600">{query.errorMessage}<button onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></p>
  const items = query.data
  const graded = items.filter((item) => item.status === 'GRADED' && item.totalScore != null)
  const summary = Number(maxScore) > 0 ? buildAssignmentGradeExport(graded, maxScore).summary : null
  const ranked = [...graded].sort((a, b) => Number(b.totalScore) - Number(a.totalScore) || a.fullName.localeCompare(b.fullName, 'vi'))
  let previousScore, rank = 0
  const rankings = ranked.map((item, index) => {
    if (Number(item.totalScore) !== previousScore) rank = index + 1
    previousScore = Number(item.totalScore)
    return { ...item, rank }
  })
  const unfinished = items.filter((item) => item.status !== 'GRADED' || item.totalScore == null)
  return <div className="space-y-4">
    {query.isError && <p role="alert" className="text-amber-700">Chưa cập nhật được dữ liệu mới. <button onClick={() => query.refetch()} className="underline">Thử lại</button></p>}
    <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-emerald-900">{tab === 'statistics' ? 'Thống kê đợt giao' : 'Bảng xếp hạng'}</h2>
      <p className="mt-2 text-sm text-slate-500">Toàn bộ {items.length} học sinh trong phạm vi đang xem. Chỉ tính điểm đã chấm; học sinh chưa làm không tính 0 trên trang này.</p>
    </section>
    {!items.length ? <p className="p-6 text-center text-slate-500">Chưa có học sinh trong đợt giao này.</p> : tab === 'statistics' ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        ['Điểm trung bình', summary?.average == null ? '—' : `${summary.average}/10`],
        ['Điểm cao nhất', ranked.length && Number(maxScore) > 0 ? `${Number((Number(ranked[0].totalScore) / Number(maxScore) * 10).toFixed(3))}/10` : '—'],
        ['Điểm thấp nhất', ranked.length && Number(maxScore) > 0 ? `${Number((Number(ranked.at(-1).totalScore) / Number(maxScore) * 10).toFixed(3))}/10` : '—'],
        ['Mốt', !graded.length ? '—' : summary?.modes.length ? summary.modes.join(' · ') : 'Không có mốt'],
      ].map(([label, value]) => <section key={label} className="rounded-2xl border border-emerald-100 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><strong className="mt-3 block text-2xl text-emerald-800">{value}</strong></section>)}</div>
      <div className="grid gap-4 lg:grid-cols-2"><GradeDonut title="Phân bố điểm đã chấm" center={graded.length} segments={[
        { label: 'Giỏi (từ 8)', count: summary?.excellent ?? 0, color: '#10b981' },
        { label: 'Khá (6,5 đến dưới 8)', count: summary?.good ?? 0, color: '#38bdf8' },
        { label: 'Trung bình (5 đến dưới 6,5)', count: summary?.averageCount ?? 0, color: '#f59e0b' },
        { label: 'Yếu (dưới 5)', count: summary?.weak ?? 0, color: '#f43f5e' },
      ]} caption="Điểm quy đổi thang 10; không gồm bài chưa làm và chờ chấm." />
      <GradeDonut title="Tiến độ làm bài" center={items.length} segments={[
        ['NOT_STARTED', '#94a3b8'], ['IN_PROGRESS', '#38bdf8'], ['SUBMITTED', '#f59e0b'], ['GRADED', '#10b981'],
      ].map(([status, color]) => ({ label: attemptLabels[status], count: items.filter((item) => item.status === status).length, color }))} caption="Tình trạng bài làm hiện tại của tất cả học sinh trong phạm vi đợt giao." /></div>
    </> : <AssignmentLeaderboard rankings={rankings} unfinished={unfinished} maxScore={maxScore} onView={onView} />}
  </div>
}
