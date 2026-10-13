import { adaptAttemptSections, readAttemptAnswers } from '../helpers/examAttemptAdapter'
import StudentQuestionCard from './StudentQuestionCard'
import ExamMedia from './ExamMedia'
import MathRenderer from '../../../teacher/exams/builder/components/math/MathRenderer'

export default function ExamAnswerReview({ result }) {
  if (!result.answersVisible) return null
  const sections = adaptAttemptSections(result.sections)
  const answers = readAttemptAnswers(sections.flatMap((section) => section.questions), result.answers)
  const review = new Map((result.review ?? []).map((item) => [String(item.answerId), item]))
  let number = 0
  return <div className="mt-8 space-y-8"><h2 className="text-xl font-bold text-slate-900">Đề thi và đáp án</h2>{sections.map((section) => <section key={section.id} className="space-y-4"><h3 className="border-l-4 border-emerald-500 pl-4 text-lg font-bold">{section.title}</h3>{section.paragraph && <p className="rounded-xl bg-emerald-50 p-5"><MathRenderer content={section.paragraph} /></p>}<ExamMedia {...section} />{section.questions.map((question) => {
    const item = review.get(String(question.id))
    const correctOptions = question.optionRecords.filter((option) => item?.correctOptionIds?.includes(option.id))
    return <div key={question.id}><StudentQuestionCard question={question} number={question.displayNumber ?? ++number} value={answers[question.id]} locked flagged={false} /><div className="mx-2 rounded-b-xl border border-t-0 border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
      <p className="font-semibold">{item?.correct === true ? 'Trả lời đúng' : item?.correct === false ? 'Trả lời chưa đúng' : 'Đáp án đã nộp'}{result.scoreVisible && item?.score != null ? ` · ${item.score} điểm` : ''}</p>
      {item?.correctText != null && <p className="mt-2">Đáp án: <MathRenderer content={item.correctText} /></p>}
      {correctOptions.map((option) => <div key={option.id} className="mt-2"><MathRenderer content={`Đáp án: ${option.content}`} /><ExamMedia {...option} /></div>)}
      {item?.correctBooleans?.map((answer) => <p key={answer.optionId} className="mt-2"><MathRenderer content={question.optionRecords.find((option) => option.id === answer.optionId)?.content ?? ''} />: {answer.value ? 'Đúng' : 'Sai'}</p>)}
      {!item?.correctText && !correctOptions.length && !item?.correctBooleans?.length && <p className="mt-2 text-slate-500">Không có đáp án đúng được công bố cho mục này.</p>}
    </div></div>
  })}</section>)}</div>
}
