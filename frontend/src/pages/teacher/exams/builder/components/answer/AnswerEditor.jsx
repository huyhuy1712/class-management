import { Trash2 } from 'lucide-react'

import ChoiceAnswer from './types/ChoiceAnswer'
import TextAnswer from './types/TextAnswer'
import TrueFalseAnswer from './types/TrueFalseAnswer'

const editors = {
  TEXT: TextAnswer,
  SINGLE_CHOICE: ChoiceAnswer,
  MULTIPLE_CHOICE: ChoiceAnswer,
  TRUE_FALSE: TrueFalseAnswer,
}

function AnswerEditor({ answer, onChange, onRemove }) {
  const Editor = editors[answer.answerType] ?? TextAnswer

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-slate-500">
          {answer.answerType}
        </span>
        <button type="button" onClick={onRemove} className="cursor-pointer text-slate-400 hover:text-red-500">
          <Trash2 size={16} />
        </button>
      </div>

      <Editor answer={answer} onChange={onChange} />

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <input
          value={answer.imageUrl}
          onChange={(event) => onChange({ imageUrl: event.target.value })}
          placeholder="Image URL"
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none"
        />
        <input
          value={answer.audioUrl}
          onChange={(event) => onChange({ audioUrl: event.target.value })}
          placeholder="Audio URL"
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none"
        />
        <input
          type="number"
          min="0"
          value={answer.point}
          onChange={(event) => onChange({ point: event.target.value })}
          placeholder="Điểm"
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none"
        />
        <input
          type="number"
          min="1"
          value={answer.orderIndex}
          onChange={(event) => onChange({ orderIndex: event.target.value })}
          placeholder="Thứ tự"
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none"
        />
      </div>
    </div>
  )
}

export default AnswerEditor
