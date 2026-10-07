import { MATH_TEMPLATES } from './mathTemplates'

function MathToolbar({ onInsert }) {
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-indigo-100 bg-indigo-50/70 p-2">
      {MATH_TEMPLATES.map((item) => (
        <button key={item.label} type="button" title={item.label} onClick={() => onInsert(item.latex)} className="min-w-9 cursor-pointer rounded-lg border border-indigo-100 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-100 hover:text-indigo-700">
          {item.symbol}
        </button>
      ))}
    </div>
  )
}
export default MathToolbar
