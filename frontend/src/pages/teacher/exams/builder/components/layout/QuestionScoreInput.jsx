import { useState } from 'react'
import { getQuestionScore } from '../../helpers/examScoreUtils'
import { canDistributeQuestionScore } from '../../helpers/examScoreDistribution'
import { isExamPoint } from '../../helpers/examScoringValidation'

function QuestionScoreInput({ question, onChange }) {
  const score = getQuestionScore(question)
  const [draftValue, setDraftValue] = useState(null)
  const editable = canDistributeQuestionScore(question)

  return (
    <label className="flex items-center gap-0.5">
      <input
        type="number" min="0" max="9999.99" step="0.01"
        aria-label="Điểm câu hỏi" value={draftValue ?? String(score)} disabled={!editable}
        title={editable ? 'Nhập tổng điểm câu; điểm đáp án và rule được phân bổ theo tỷ lệ hiện tại' : 'Thêm đáp án và chọn phương án đúng hoặc tạo rule trước khi nhập điểm'}
        onChange={(event) => {
          const next = event.target.value
          setDraftValue(next)
          if (isExamPoint(next)) onChange(next)
        }}
        onBlur={() => setDraftValue(null)}
        className="w-14 rounded border border-emerald-200 bg-white px-1 py-1 text-right text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
      />
      <span className="text-sm text-slate-500">đ</span>
    </label>
  )
}

export default QuestionScoreInput
