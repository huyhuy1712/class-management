import { CheckCircle2, FileText, ListChecks, MessageSquareText, X } from 'lucide-react'
import { useState } from 'react'

import { ANSWER_TYPES } from '../../helpers/examBuilderConstants'

const icons = {
  TRUE_FALSE: CheckCircle2,
  CHOICE: ListChecks,
  SHORT_ANSWER: MessageSquareText,
  TEXT: FileText,
}

function AnswerTypeSelector({ onSelect }) {
  const [open, setOpen] = useState(false)

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-2.5 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50">
      + Thêm kiểu đáp án
    </button>
  )

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div><p className="text-base font-bold text-slate-900">Chọn kiểu đáp án</p><p className="mt-0.5 text-sm text-slate-700">Mỗi kiểu sẽ có cách cấu hình riêng.</p></div>
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"><X size={16}/></button>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {ANSWER_TYPES.map((type) => {
          const Icon = icons[type.value]
          return <button key={type.value} type="button" onClick={() => { onSelect(type.value); setOpen(false) }} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white bg-white px-3 py-3 text-left text-base font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><Icon size={16}/></span>{type.label}
          </button>
        })}
      </div>
    </div>
  )
}
export default AnswerTypeSelector
