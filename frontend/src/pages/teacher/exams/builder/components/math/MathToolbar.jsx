import { useState } from 'react'
import { MATH_TEMPLATE_GROUPS } from './mathTemplates'

function MathToolbar({ onInsert }) {
  const [activeGroup, setActiveGroup] = useState(MATH_TEMPLATE_GROUPS[0].id)
  const group = MATH_TEMPLATE_GROUPS.find((item) => item.id === activeGroup) ?? MATH_TEMPLATE_GROUPS[0]

  return (
    <div className="border-b border-indigo-100 bg-indigo-50/60">
      <div className="flex gap-1 overflow-x-auto border-b border-indigo-100 px-2 pt-2">
        {MATH_TEMPLATE_GROUPS.map((item) => (
          <button key={item.id} type="button" onClick={() => setActiveGroup(item.id)} className={`shrink-0 cursor-pointer rounded-t-lg px-3 py-2 text-xs font-bold transition ${activeGroup === item.id ? 'bg-white text-indigo-700 shadow-[0_-1px_0_rgba(99,102,241,0.08)]' : 'text-slate-500 hover:bg-white/60 hover:text-indigo-600'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex min-h-[54px] flex-wrap gap-1.5 bg-white/70 p-2">
        {group.items.map((item) => (
          <button key={item.label} type="button" title={item.label} onClick={() => onInsert(item.latex)} className="min-w-9 cursor-pointer rounded-lg border border-indigo-100 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
            {item.symbol}
          </button>
        ))}
      </div>
    </div>
  )
}
export default MathToolbar
