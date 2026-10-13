import { Link, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import useResourceQuery from '../../../query/useResourceQuery'
import StudentDashboardLayout from '../../../layouts/StudentDashboardLayout'
import ExamAnswerReview from './components/ExamAnswerReview'

export default function StudentExamResultPage() {
  const { attemptId } = useParams()
  const query = useResourceQuery('examAttemptResult', [attemptId], { staleTime: 0, refetchInterval: 30_000 })
  const result = query.data
  return <StudentDashboardLayout><main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
    <Link to="/student/exams" className="mb-6 inline-block text-sm font-semibold text-emerald-700">← Danh sách bài kiểm tra</Link>
    {!result ? <div className="rounded-2xl bg-white p-6"><p role={query.errorMessage ? 'alert' : 'status'}>{query.errorMessage || 'Đang tải kết quả...'}</p>{query.errorMessage && <button onClick={() => query.refetch()} className="mt-3 text-emerald-700 underline">Thử lại</button>}</div> : <>
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm sm:p-10"><CheckCircle2 size={48} className="mx-auto text-emerald-600" /><h1 className="mt-4 text-2xl font-bold text-slate-900">Đã nộp bài thành công</h1><p className="mt-2 text-slate-500">Lượt thi {result.attemptNumber} · {result.isFinal ? 'Đã chấm xong' : 'Đang chờ chấm thêm'}</p>
        {result.scoreVisible ? <div className="mt-6 rounded-2xl bg-emerald-50 p-6"><p className="text-sm text-emerald-800">{result.isFinal ? 'Tổng điểm' : 'Điểm tạm thời'}</p><p className="mt-2 text-4xl font-bold text-emerald-700">{result.totalScore ?? '—'}</p><p className="mt-2 text-sm text-emerald-800">Tự động: {result.autoScore ?? '—'} · Tự luận: {result.manualScore ?? '—'}</p></div> : <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Điểm chưa được công bố theo cài đặt của giáo viên.</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-5 text-sm text-slate-500"><span>Thời gian làm: {Math.floor((result.durationSeconds ?? 0) / 60)} phút {(result.durationSeconds ?? 0) % 60} giây</span><span>Rời tab: {result.tabSwitchCount}</span></div>
        {result.teacherComment && <p className="mt-5 whitespace-pre-wrap text-left text-sm text-slate-700">Nhận xét: {result.teacherComment}</p>}
        {!result.answersVisible && <p className="mt-5 text-sm text-slate-500">Đề thi và đáp án chưa được phép xem.</p>}
      </section><ExamAnswerReview result={result} />
    </>}
  </main></StudentDashboardLayout>
}
