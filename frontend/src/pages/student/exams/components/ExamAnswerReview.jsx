import { adaptAttemptSections, readAttemptAnswers } from '../helpers/examAttemptAdapter'
import StudentQuestionCard from './StudentQuestionCard'
import ExamMedia from './ExamMedia'
import MathRenderer from '../../../teacher/exams/builder/components/math/MathRenderer'
import ExamQuestionNavigator from './ExamQuestionNavigator'
import { getReviewStatus, isQuestionAnswered } from '../helpers/examPaperHelpers'
import { Lightbulb, ChevronDown } from 'lucide-react'

export default function ExamAnswerReview({ result, renderGrading }) {
  if (!result.answersVisible) return null
  const sections = adaptAttemptSections(result.sections)
  const answers = readAttemptAnswers(sections.flatMap((section) => section.questions), result.answers)
  const review = new Map((result.review ?? []).map((item) => [String(item.answerId), item]))
  const questions = sections.flatMap((section) => section.questions)
  const reviewStatuses = Object.fromEntries(questions.map((question) => [question.id, getReviewStatus(question, answers[question.id], review.get(String(question.id)))]))
  const answered = questions.filter((question) => isQuestionAnswered(question, answers[question.id])).length
  let number = 0
  return <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="min-w-0 space-y-8"><h2 className="text-xl font-bold text-slate-900">Đề thi và đáp án</h2>{sections.map((section) => <section key={section.id} className="space-y-4"><h3 className="border-l-4 border-emerald-500 pl-4 text-xl font-bold">{section.title}</h3>{section.paragraph && <p className="break-words rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 leading-7"><MathRenderer content={section.paragraph} /></p>}<ExamMedia {...section} />{section.questions.map((question) => {
    const item = review.get(String(question.id))
    const correctOptions = question.optionRecords.filter((option) => item?.correctOptionIds?.includes(option.id))
    return <div key={question.id}><StudentQuestionCard question={question} number={question.displayNumber ?? ++number} value={answers[question.id]} locked flagged={false} />{renderGrading?.(question)}<details open className="group mx-2 rounded-b-xl border border-t-0 border-emerald-100 bg-white p-4 text-sm text-slate-700">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold"><span className={reviewStatuses[question.id] === 'WRONG' ? 'text-red-700' : reviewStatuses[question.id] === 'CORRECT' ? 'text-emerald-700' : 'text-slate-500'}>{({ CORRECT: 'Trả lời đúng', WRONG: 'Trả lời chưa đúng', EMPTY: 'Chưa làm', PENDING: 'Chờ đánh giá' })[reviewStatuses[question.id]]}{result.scoreVisible && item?.score != null ? ` · ${item.score} điểm` : ''} · Đáp án và giải thích</span><ChevronDown size={17} className="shrink-0 transition-transform group-open:rotate-180" /></summary>
      {item?.correctText != null && <p className="mt-2">Đáp án: <MathRenderer content={item.correctText} /></p>}
      {correctOptions.map((option) => <div key={option.id} className="mt-2"><MathRenderer content={`Đáp án: ${option.content}`} /><ExamMedia {...option} /></div>)}
      {item?.correctBooleans?.map((answer) => <p key={answer.optionId} className="mt-2"><MathRenderer content={question.optionRecords.find((option) => option.id === answer.optionId)?.content ?? ''} />: {answer.value ? 'Đúng' : 'Sai'}</p>)}
      {!item?.correctText && !correctOptions.length && !item?.correctBooleans?.length && <p className="mt-2 text-slate-500">Không có đáp án đúng được công bố cho mục này.</p>}
      {(question.explanation || question.explanationImageMedia || question.explanationAudioMedia) && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4"><p className="mb-2 flex items-center gap-2 font-semibold text-amber-800"><Lightbulb size={17} />Giải thích</p>{question.explanation && <p className="whitespace-pre-wrap break-words leading-7"><MathRenderer content={question.explanation} /></p>}<ExamMedia imageMedia={question.explanationImageMedia} audioMedia={question.explanationAudioMedia} /></div>}
    </details></div>
  })}</section>)}</div><ExamQuestionNavigator questions={questions} answers={answers} answered={answered} reviewStatuses={reviewStatuses} itemLabel="mục" /></div>
}
