import { Plus, Trash2 } from 'lucide-react'

function TrueFalseScoringRules({ enabled, rules = [], onToggle, onAdd, onChange, onRemove }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-bold text-slate-700">Chấm điểm theo số câu đúng</p><p className="mt-0.5 text-[11px] text-slate-500">Tự đặt quy luật: đúng bao nhiêu câu được bao nhiêu điểm.</p></div>
        <button type="button" role="switch" aria-checked={enabled} onClick={onToggle} className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${enabled ? 'bg-amber-500' : 'bg-slate-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${enabled ? 'left-6' : 'left-1'}`}/></button>
      </div>
      {enabled && <div className="mt-3 space-y-2 border-t border-amber-100 pt-3">
        {rules.map((rule, index) => <div key={rule.id} className="flex flex-wrap items-end gap-2 rounded-lg bg-white/80 p-2">
          <label className="min-w-[120px] flex-1"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Số câu đúng</span><input type="number" min="0" value={rule.correctCount} onChange={(e)=>onChange(rule.id,{ correctCount:e.target.value })} className="w-full rounded-lg border border-amber-100 px-2.5 py-2 text-sm outline-none focus:border-amber-300"/></label>
          <label className="min-w-[120px] flex-1"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Điểm nhận được</span><input type="number" min="0" step="0.01" value={rule.point} onChange={(e)=>onChange(rule.id,{ point:e.target.value })} className="w-full rounded-lg border border-amber-100 px-2.5 py-2 text-sm outline-none focus:border-amber-300"/></label>
          <button type="button" title={`Xóa quy luật ${index+1}`} onClick={()=>onRemove(rule.id)} className="mb-0.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15}/></button>
        </div>)}
        <button type="button" onClick={onAdd} className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-300 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100/60"><Plus size={14}/> Thêm quy luật chấm</button>
      </div>}
    </div>
  )
}
export default TrueFalseScoringRules
