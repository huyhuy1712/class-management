import ExamQuestionNavigator from './ExamQuestionNavigator'
import ExamMedia from './ExamMedia'
import ExamReviewQuestion from './ExamReviewQuestion'
import {
  adaptAttemptSections,
  readAttemptAnswers,
} from '../helpers/examAttemptAdapter'
import {
  getReviewStatus,
  isQuestionAnswered,
} from '../helpers/examPaperHelpers'
import MathRenderer from '../../../teacher/exams/builder/components/math/MathRenderer'

export default function ExamAnswerReview({ result, renderGrading }) {
  if (!result.answersVisible) return null

  const sections = adaptAttemptSections(result.sections)
  const questions = sections.flatMap((section) => section.questions)
  const answers = readAttemptAnswers(questions, result.answers)
  const reviewByAnswerId = new Map(
    (result.review ?? []).map((item) => [String(item.answerId), item]),
  )
  const reviewStatuses = Object.fromEntries(
    questions.map((question) => [
      question.id,
      getReviewStatus(
        question,
        answers[question.id],
        reviewByAnswerId.get(String(question.id)),
      ),
    ]),
  )
  const answered = questions.filter((question) =>
    isQuestionAnswered(question, answers[question.id]),
  ).length

  let nextQuestionNumber = 0

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 space-y-8">
        <h2 className="text-xl font-bold text-slate-900">Đề thi và đáp án</h2>

        {sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <h3 className="border-l-4 border-emerald-500 pl-4 text-xl font-bold">
              {section.title}
            </h3>

            {section.paragraph && (
              <p className="break-words rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 leading-7">
                <MathRenderer content={section.paragraph} />
              </p>
            )}

            <ExamMedia {...section} />

            {section.questions.map((question) => {
              const number = question.displayNumber ?? ++nextQuestionNumber

              return (
                <ExamReviewQuestion
                  key={question.id}
                  question={question}
                  number={number}
                  answer={answers[question.id]}
                  review={reviewByAnswerId.get(String(question.id))}
                  reviewStatus={reviewStatuses[question.id]}
                  result={result}
                  renderGrading={renderGrading}
                />
              )
            })}
          </section>
        ))}
      </div>

      <ExamQuestionNavigator
        questions={questions}
        answers={answers}
        answered={answered}
        reviewStatuses={reviewStatuses}
        itemLabel="mục"
      />
    </div>
  )
}
