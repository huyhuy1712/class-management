import { ChevronDown, Lightbulb } from 'lucide-react'
import ExamMedia from './ExamMedia'
import StudentQuestionCard from './StudentQuestionCard'
import MathRenderer from '../../../teacher/exams/builder/components/math/MathRenderer'

const reviewStatusLabels = {
  GRADED: 'Đã chấm tự luận',
  CORRECT: 'Trả lời đúng',
  WRONG: 'Trả lời chưa đúng',
  EMPTY: 'Chưa làm',
  PENDING: 'Chờ đánh giá',
}

function getStatusTone(status) {
  if (status === 'WRONG') return 'text-red-700'
  if (status === 'CORRECT' || status === 'GRADED') return 'text-emerald-700'
  return 'text-slate-500'
}

function CorrectAnswers({ question, review }) {
  const correctOptions = question.optionRecords.filter((option) =>
    review?.correctOptionIds?.includes(option.id),
  )

  return (
    <>
      {review?.correctText != null && (
        <p className="mt-2">
          Đáp án: <MathRenderer content={review.correctText} />
        </p>
      )}

      {correctOptions.map((option) => (
        <div key={option.id} className="mt-2">
          <MathRenderer content={`Đáp án: ${option.content}`} />
          <ExamMedia {...option} />
        </div>
      ))}

      {review?.correctBooleans?.map((answer) => {
        const option = question.optionRecords.find(
          (item) => item.id === answer.optionId,
        )

        return (
          <p key={answer.optionId} className="mt-2">
            <MathRenderer content={option?.content ?? ''} />:{' '}
            {answer.value ? 'Đúng' : 'Sai'}
          </p>
        )
      })}

      {question.type !== 'ESSAY'
        && !review?.correctText
        && correctOptions.length === 0
        && !review?.correctBooleans?.length && (
          <p className="mt-2 text-slate-500">
            Không có đáp án đúng được công bố cho mục này.
          </p>
        )}
    </>
  )
}

function QuestionExplanation({ question }) {
  const hasExplanation = question.explanation
    || question.explanationImageMedia
    || question.explanationAudioMedia

  if (!hasExplanation) return null

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="mb-2 flex items-center gap-2 font-semibold text-amber-800">
        <Lightbulb size={17} />
        Giải thích
      </p>

      {question.explanation && (
        <p className="whitespace-pre-wrap break-words leading-7">
          <MathRenderer content={question.explanation} />
        </p>
      )}

      <ExamMedia
        imageMedia={question.explanationImageMedia}
        audioMedia={question.explanationAudioMedia}
      />
    </div>
  )
}

export default function ExamReviewQuestion({
  question,
  number,
  answer,
  review,
  reviewStatus,
  result,
  renderGrading,
}) {
  const statusTone = getStatusTone(reviewStatus)

  return (
    <div>
      <StudentQuestionCard
        question={question}
        number={number}
        value={answer}
        answerReview={review}
        locked
        flagged={false}
      />

      {renderGrading?.(question)}

      {!renderGrading && question.type === 'ESSAY' && result.scoreVisible && (
        <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {review?.score != null
            ? `Điểm tự luận: ${review.score}/${question.points} điểm · Đã chấm`
            : 'Câu tự luận đang chờ giáo viên chấm'}
        </div>
      )}

      <details open className="group mx-2 mt-3 rounded-xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
          <span className={statusTone}>
            {reviewStatusLabels[reviewStatus]}
            {result.scoreVisible && review?.score != null
              ? ` · ${review.score} điểm`
              : ''}
            {' · Đáp án và giải thích'}
          </span>
          <ChevronDown
            size={17}
            className="shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>

        <CorrectAnswers question={question} review={review} />
        <QuestionExplanation question={question} />
      </details>
    </div>
  )
}
