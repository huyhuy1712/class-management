import { Trash2 } from 'lucide-react'
import AnswerEditor from './AnswerEditor'
import AnswerTypeSelector from './AnswerTypeSelector'

const typeLabel = { CHOICE: 'Trắc nghiệm', TRUE_FALSE: 'Đúng / Sai', SHORT_ANSWER: 'Trả lời ngắn', TEXT: 'Văn bản' }

function AnswerGroup({ group, index, actions }) {
  const isChoice = group.answerType === 'CHOICE'
  const isTrueFalse = group.answerType === 'TRUE_FALSE'
  const hasMultipleItems = isChoice || isTrueFalse

  if (!group.answerType) return (
    <div id={`answer-group-${group.id}`} className="rounded-2xl border border-dashed border-emerald-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">Đáp án {index + 1}</span><button type="button" onClick={actions.remove} className="cursor-pointer text-slate-400 hover:text-red-500"><Trash2 size={15}/></button></div>
      <AnswerTypeSelector onSelect={actions.setType} />
    </div>
  )

  return (
    <div id={`answer-group-${group.id}`} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div><span className="text-xs font-bold text-slate-400">Đáp án {index + 1}</span><p className="text-sm font-bold text-emerald-700">{typeLabel[group.answerType]}</p></div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => actions.setType(null)} className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-emerald-700">Đổi kiểu</button><button type="button" onClick={actions.remove} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15}/></button></div>
      </div>

      {hasMultipleItems && (
        <div className="grid gap-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3 lg:grid-cols-[160px_1fr]">
          <label><span className="mb-1 block text-xs font-bold text-slate-600">Số lượng</span><input type="number" min="2" max="50" value={group.answers.length || ''} onChange={(e)=>actions.setChoiceCount(e.target.value)} placeholder="Số lượng" className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm outline-none"/></label>
          <div><span className="mb-1 block text-xs font-bold text-slate-600">Cho phép nhiều câu đúng</span><button type="button" role="switch" aria-checked={group.choiceMode === 'MULTIPLE'} onClick={()=>actions.setChoiceMode(group.choiceMode === 'MULTIPLE' ? 'SINGLE' : 'MULTIPLE')} className="flex cursor-pointer items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-bold text-slate-700"><span className={`relative h-5 w-9 rounded-full ${group.choiceMode === 'MULTIPLE' ? 'bg-violet-500' : 'bg-slate-300'}`}><span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${group.choiceMode === 'MULTIPLE' ? 'left-5' : 'left-1'}`}/></span>{group.choiceMode === 'MULTIPLE' ? 'Đang bật' : 'Đang tắt'}</button></div>
        </div>
      )}

      {group.answers.map((answer) => <AnswerEditor key={answer.id} answer={answer} selectable={hasMultipleItems} onChange={(changes)=>actions.updateAnswer(answer.id, changes)} onRemove={()=>actions.removeAnswer(answer.id)} />)}
      {hasMultipleItems && <button type="button" onClick={actions.addChoice} className="w-full cursor-pointer rounded-xl border border-dashed border-sky-300 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50">+ {isTrueFalse ? 'Thêm câu đúng / sai' : 'Thêm phương án'}</button>}
    </div>
  )
}
export default AnswerGroup
