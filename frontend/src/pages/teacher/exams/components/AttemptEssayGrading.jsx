export default function AttemptEssayGrading({
  question,
  result,
  grades,
  isSaving,
  onGradeChange,
}) {
  if (question.type !== 'ESSAY') return null

  const answer = result.answers.find((item) => item.answerId === question.id)
  const blank = !answer?.text?.trim()
  const review = result.review.find((item) => item.answerId === question.id)

  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <label className="flex flex-wrap items-center gap-3 font-semibold">
        Điểm tự luận
        <input
          type="number"
          aria-label={`Điểm câu ${question.displayNumber}`}
          min={0}
          max={question.points}
          step="0.001"
          disabled={blank || isSaving}
          value={blank ? 0 : grades[question.id] ?? review?.score ?? ''}
          onChange={(event) =>
            onGradeChange(question.id, event.target.value)
          }
          className="w-24 rounded-lg border border-amber-200 bg-white p-2"
        />
        / {question.points}
      </label>
      {blank && (
        <p className="mt-2 text-xs text-slate-500">
          Câu bỏ trống được tính 0 điểm, không chấm thủ công.
        </p>
      )}
    </div>
  )
}
