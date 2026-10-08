import { Plus, Trash2 } from 'lucide-react'
import AnswerGroup from '../answer/AnswerGroup'
import MediaFilePicker from '../common/MediaFilePicker'
import MathContentInput from '../math/MathContentInput'

function QuestionCard({ question, index, onChange, onRemove, answerActions, validationErrors = {} }) {
  return (
    <div id={`question-${question.id}`} className={`rounded-[18px] border p-4 shadow-[0_4px_14px_rgba(31,56,45,0.04)] ${validationErrors[`question-${question.id}`] ? 'border-red-300 bg-red-50/40' : 'border-slate-200/80 bg-slate-50/70'}`}>
      <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-slate-800">Câu {index + 1}</p><button type="button" onClick={onRemove} className="cursor-pointer text-slate-400 hover:text-red-500"><Trash2 size={17}/></button></div>
      {validationErrors[`question-${question.id}`] && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{validationErrors[`question-${question.id}`]}</p>}
      <MathContentInput value={question.content} onChange={(content) => onChange({ content })} placeholder="Nhập nội dung câu hỏi..." />
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="w-[140px]"><MediaFilePicker type="image" file={question.imageFile ?? question.imageMedia} onChange={(file) => onChange({ imageFile: file })}/></div>
        <div className="w-[140px]"><MediaFilePicker type="audio" file={question.audioFile ?? question.audioMedia} onChange={(file) => onChange({ audioFile: file })}/></div>
        <label className="w-[90px] space-y-1"><span className="text-[10px] font-semibold text-slate-500">Điểm</span><input type="number" min="0.01" max="9999.99" step="0.01" value={question.point} onChange={(e) => onChange({ point: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-emerald-400"/></label>
        <label className="w-[90px] space-y-1"><span className="text-[10px] font-semibold text-slate-500">Thứ tự</span><input type="number" min="1" value={question.orderIndex} onChange={(e) => onChange({ orderIndex: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-emerald-400"/></label>
      </div>
      <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Đáp án · {question.answerGroups.length}</p></div>
        {question.answerGroups.map((group, groupIndex) => <AnswerGroup key={group.id} group={group} index={groupIndex} actions={answerActions(group.id)} error={validationErrors[`answer-group-${group.id}`]} />)}
        <button type="button" onClick={answerActions().addGroup} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"><Plus size={16}/> Thêm đáp án</button>
      </div>
    </div>
  )
}
export default QuestionCard
