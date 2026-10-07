import { Plus, X } from 'lucide-react'
import { useState } from 'react'

import { ANSWER_TYPES } from '../../helpers/examBuilderConstants'

function AnswerTypeSelector({ onSelect }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        <Plus size={15} />
        Thêm đáp án
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700">Chọn kiểu đáp án</p>
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-slate-400">
          <X size={15} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ANSWER_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => {
              onSelect(type.value)
              setOpen(false)
            }}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default AnswerTypeSelector
