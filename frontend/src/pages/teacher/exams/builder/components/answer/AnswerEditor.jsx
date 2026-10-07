import { Trash2 } from 'lucide-react'

import MediaFilePicker from '../common/MediaFilePicker'
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
        <span className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-slate-500">{answer.answerType}</span>
        <button type="button" onClick={onRemove} className="cursor-pointer text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
      </div>

      <Editor answer={answer} onChange={onChange} />

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <MediaFilePicker type="image" file={answer.imageFile} onChange={(file) => onChange({ imageFile: file })} />
        <MediaFilePicker type="audio" file={answer.audioFile} onChange={(file) => onChange({ audioFile: file })} />

        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Điểm</span>
          <input type="number" min="0" value={answer.point} onChange={(e) => onChange({ point: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Thứ tự</span>
          <input type="number" min="1" value={answer.orderIndex} onChange={(e) => onChange({ orderIndex: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
        </label>
      </div>
    </div>
  )
}

export default AnswerEditor
