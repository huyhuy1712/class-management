import { Link } from 'react-router-dom'
import { Clock3, Send, ArrowLeft } from 'lucide-react'
import { studentExamPaper } from './mocks/studentExamPaper'
import useExamPaperPreview from './hooks/useExamPaperPreview'
import { formatRemainingTime } from './helpers/examPaperHelpers'
import StudentQuestionCard from './components/StudentQuestionCard'
import ExamQuestionNavigator from './components/ExamQuestionNavigator'
import SubmitExamPreviewModal from './components/SubmitExamPreviewModal'

export default function StudentExamPaperPreviewPage() {
  const paper = studentExamPaper
  const state = useExamPaperPreview(paper)
  let number = 0
  return <main className="min-h-screen bg-slate-100/80 pb-12">
    <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div><Link to="/student/exams" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"><ArrowLeft size={14} />Quay lại</Link><h1 className="mt-1 text-sm font-bold text-slate-900 sm:text-lg">{paper.title}</h1></div><div className="flex items-center gap-3"><span role="timer" aria-label="Thời gian còn lại" className={`flex items-center gap-2 rounded-xl px-3 py-2 font-mono font-bold ring-1 ${state.remaining < 60 ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'}`}><Clock3 size={18} />{formatRemainingTime(state.remaining)}</span><button type="button" disabled={state.submitted} onClick={() => state.setConfirmOpen(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-800 hover:to-green-700 disabled:opacity-50"><Send size={16} />Nộp bài</button></div></div></header>
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-8"><p className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-800 shadow-sm">Bản thử giao diện · Dữ liệu mẫu · Đáp án chỉ giữ trong trang này, tải lại trang sẽ bắt đầu lại.</p>
      {state.submitted && <p role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">Đã nộp bài mẫu. Bạn đã trả lời {state.answered}/{state.questions.length} câu. Chưa tính điểm hoặc gửi lên máy chủ.</p>}
      {!state.submitted && state.remaining === 0 && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">Đã hết giờ. Đáp án đã khóa; bạn có thể nộp bài mẫu.</p>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="space-y-8">{paper.sections.map((section) => <section key={section.id} className="space-y-4"><header className="border-l-4 border-emerald-500 pl-4"><h2 className="text-xl font-bold text-slate-900">{section.title}</h2>{section.description && <p className="mt-2 text-sm text-slate-500">{section.description}</p>}</header>{section.paragraph && <p className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 leading-7 text-slate-700 shadow-sm">{section.paragraph}</p>}{section.questions.map((question) => <StudentQuestionCard key={question.id} question={question} number={++number} value={state.answers[question.id]} flagged={state.flags.includes(question.id)} locked={state.locked} onChange={(value) => state.changeAnswer(question.id, value)} onFlag={() => state.toggleFlag(question.id)} />)}</section>)}</div><ExamQuestionNavigator {...state} /></div>
    </div><SubmitExamPreviewModal open={state.confirmOpen} onClose={() => state.setConfirmOpen(false)} onSubmit={state.submit} unanswered={state.questions.length - state.answered} />
  </main>
}
