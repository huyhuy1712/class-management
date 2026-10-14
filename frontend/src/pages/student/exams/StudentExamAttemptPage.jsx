import FrogLoading from '../../../utils/FrogLoading'
import { Link, useParams } from 'react-router-dom'
import { Clock3, Send, ArrowLeft } from 'lucide-react'
import useExamAttempt from './hooks/useExamAttempt'
import { formatRemainingTime } from './helpers/examPaperHelpers'
import StudentQuestionCard from './components/StudentQuestionCard'
import ExamQuestionNavigator from './components/ExamQuestionNavigator'
import SubmitExamModal from './components/SubmitExamModal'
import ExamMedia from './components/ExamMedia'
import MathRenderer from '../../teacher/exams/builder/components/math/MathRenderer'
import useAuthStore from '../../../stores/authStore'

function AttemptPaper({ attemptId }) {
  const state = useExamAttempt(attemptId)
  const attempt = state.query.data
  if (!attempt || !state.sections.length) return <main className="min-h-screen bg-slate-100 p-8"><Link to="/student/exams" className="text-emerald-700">Quay lại danh sách</Link>{state.query.errorMessage ? <p role="alert">{state.query.errorMessage}</p> : <FrogLoading label="Đang mở bài thi..." />}{state.query.errorMessage && <button onClick={() => state.query.refetch()} className="mt-3 underline">Thử lại</button>}</main>
  let number = 0
  return <main className="min-h-screen bg-slate-100/80 pb-12">
    <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div><Link to="/student/exams" onClick={(event) => { if (!window.confirm('Rời trang làm bài? Đáp án đã lưu vẫn được giữ, đồng hồ tiếp tục chạy.')) event.preventDefault() }} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ArrowLeft size={14} />Quay lại</Link><h1 className="mt-1 text-sm font-bold text-slate-900 sm:text-lg">{attempt.exam.title}</h1><p className="text-xs text-slate-500">Lượt {attempt.attemptNumber} · {state.saving ? 'Đang lưu đáp án...' : state.savedAt ? `Đã lưu ${state.savedAt.toLocaleTimeString('vi-VN')}` : 'Tự động lưu đáp án'} · Rời tab: {attempt.tabSwitchCount}</p></div><div className="flex items-center gap-3"><span role="timer" className={`flex items-center gap-2 rounded-xl px-3 py-2 font-mono font-bold ring-1 ${state.remaining < 60 ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'}`}><Clock3 size={18} />{formatRemainingTime(state.remaining)}</span><button disabled={state.submitting} onClick={() => state.setConfirmOpen(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Send size={16} />{state.submitting ? <FrogLoading compact label="Đang nộp..." /> : 'Nộp bài'}</button></div></div></header>
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-8">
      {state.error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{state.error}<button onClick={() => { if (window.confirm('Tải lại dữ liệu máy chủ? Đáp án chưa lưu ở phiên này có thể không được khôi phục khi revision đã thay đổi.')) window.location.reload() }} className="ml-3 underline">Tải lại để đồng bộ</button></p>}
      {state.remaining === 0 && <p role="status" className="mb-6 rounded-xl bg-amber-50 p-4 text-amber-800">Đã hết giờ. Hệ thống đang hoàn tất bài với đáp án đã được máy chủ lưu.</p>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="space-y-8">{state.sections.map((section) => <section key={section.id} className="space-y-4"><header className="border-l-4 border-emerald-500 pl-4"><h2 className="text-xl font-bold text-slate-900">{section.title}</h2></header>{section.paragraph && <p className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 leading-7"><MathRenderer content={section.paragraph} /></p>}<ExamMedia {...section} />{section.questions.map((question) => <StudentQuestionCard key={question.id} question={question} number={question.displayNumber ?? ++number} value={state.answers[question.id]} flagged={state.flags.includes(question.id)} locked={state.locked} onChange={(value) => state.changeAnswer(question.id, value)} onFlag={() => state.toggleFlag(question.id)} />)}</section>)}</div><ExamQuestionNavigator {...state} itemLabel="mục" /></div>
    </div><SubmitExamModal open={state.confirmOpen} onClose={() => state.setConfirmOpen(false)} onSubmit={state.submit} unanswered={state.questions.length - state.answered} submitting={state.submitting} />
  </main>
}

export default function StudentExamAttemptPage() {
  const { attemptId } = useParams()
  const userId = useAuthStore((state) => state.user?.id)
  return <AttemptPaper key={`${userId}:${attemptId}`} attemptId={attemptId} />
}
