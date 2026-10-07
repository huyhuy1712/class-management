import { Check, Trash2 } from 'lucide-react'
import MediaFilePicker from '../common/MediaFilePicker'

function AnswerEditor({ answer, selectable = false, onChange, onRemove }) {
  return (
    <div className={`rounded-xl border p-3 transition ${answer.isCorrect ? 'border-emerald-300 bg-emerald-50/80 shadow-[0_0_0_1px_rgba(16,185,129,0.05)]' : 'border-slate-200 bg-slate-50/60'}`}>
      <div className="flex items-start gap-3">
        {selectable && <button type="button" onClick={() => onChange({ isCorrect: !answer.isCorrect })} className={`mt-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 transition ${answer.isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-emerald-400'}`}>{answer.isCorrect && <Check size={13} strokeWidth={3}/>}</button>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input value={answer.content} onChange={(e) => onChange({ content: e.target.value })} placeholder="Nhập phương án trả lời..." className={`min-w-0 flex-1 rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition ${answer.isCorrect ? 'border-emerald-200 focus:border-emerald-400' : 'border-slate-200 focus:border-emerald-400'}`}/>
            {answer.isCorrect && <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Đáp án đúng</span>}
            {onRemove && <button type="button" onClick={onRemove} className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={16}/></button>}
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div className="w-[135px]"><MediaFilePicker type="image" file={answer.imageFile} onChange={(file) => onChange({ imageFile: file })}/></div>
            <div className="w-[135px]"><MediaFilePicker type="audio" file={answer.audioFile} onChange={(file) => onChange({ audioFile: file })}/></div>
            <label className="w-[92px] space-y-1"><span className="text-[10px] font-semibold text-slate-500">Điểm</span><input type="number" min="0" value={answer.point} onChange={(e) => onChange({ point: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-emerald-400"/></label>
            <label className="w-[92px] space-y-1"><span className="text-[10px] font-semibold text-slate-500">Thứ tự</span><input type="number" min="1" value={answer.orderIndex} onChange={(e) => onChange({ orderIndex: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-emerald-400"/></label>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AnswerEditor
