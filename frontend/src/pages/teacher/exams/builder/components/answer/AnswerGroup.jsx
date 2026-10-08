import { getAnswerOptionLabel } from '../../helpers/answerOptionLabel'
import { getGroupScore } from '../../helpers/examScoreUtils'
import { Trash2 } from 'lucide-react'
import AnswerEditor from './AnswerEditor'
import AnswerTypeSelector from './AnswerTypeSelector'
import TrueFalseScoringRules from './TrueFalseScoringRules'

const typeLabel = { CHOICE: 'Trắc nghiệm', TRUE_FALSE: 'Đúng / Sai', SHORT_ANSWER: 'Trả lời ngắn', TEXT: 'Văn bản' }

function AnswerGroup({ group, index, actions, error }) {
  const isChoice = group.answerType === 'CHOICE'
  const isTrueFalse = group.answerType === 'TRUE_FALSE'
  const hasMultipleItems = isChoice || isTrueFalse

  if (!group.answerType) return (
    <div id={`answer-group-${group.id}`} className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/45 p-3">
      <div className="mb-2 flex items-center justify-between"><span className="text-base font-bold text-slate-700">Đáp án {index + 1}</span><button type="button" onClick={actions.remove} className="cursor-pointer text-slate-500 hover:text-red-500"><Trash2 size={15}/></button></div>
      <AnswerTypeSelector onSelect={actions.setType} />
    </div>
  )

  return (
    <div id={`answer-group-${group.id}`} className="space-y-3 rounded-2xl border border-violet-200/80 bg-violet-50/40 p-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-base font-semibold text-red-600">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <div><span className="text-base font-bold text-slate-700">Đáp án {index + 1}</span><p className="text-base font-bold text-emerald-800">{typeLabel[group.answerType]}</p></div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => actions.setType(null)} className="cursor-pointer text-base font-semibold text-slate-700 hover:text-emerald-800">Đổi kiểu</button><button type="button" onClick={actions.remove} className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-500"><Trash2 size={15}/></button></div>
      </div>

      <p className="text-sm text-slate-700">Điểm nhóm: <strong className="text-emerald-800">{getGroupScore(group)}</strong> · Tự tính từ đáp án và quy luật chấm điểm.</p>
      {hasMultipleItems && (
        <div className="w-fit max-w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2">
          <label className="flex flex-wrap items-center gap-3"><span className="text-base font-bold text-slate-700">Số lượng</span><input type="number" min="1" max="50" value={group.answers.length || ''} onChange={(e)=>actions.setChoiceCount(e.target.value)} placeholder="0" className="w-20 rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-emerald-400"/></label>
        </div>
      )}

      {isChoice && <button type="button" role="switch" aria-checked={group.choiceMode === 'MULTIPLE'} onClick={() => actions.setChoiceMode(group.choiceMode === 'MULTIPLE' ? 'SINGLE' : 'MULTIPLE')} className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-base font-semibold text-slate-800">
        <span className={`relative h-5 w-9 shrink-0 rounded-full ${group.choiceMode === 'MULTIPLE' ? 'bg-violet-500' : 'bg-slate-300'}`}><span className={`absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition-transform ${group.choiceMode === 'MULTIPLE' ? 'translate-x-4' : 'translate-x-0'}`} /></span>
        Cho phép nhiều đáp án đúng
      </button>}

      {isTrueFalse && <TrueFalseScoringRules count={group.answers.length} onApply={(scoringRules) => actions.updateGroup({ scoringRules })} enabled={Boolean(group.scoreByCorrectCount)} rules={group.scoringRules ?? []} onToggle={()=>actions.updateGroup({ scoreByCorrectCount: !group.scoreByCorrectCount })} onAdd={actions.addScoringRule} onChange={actions.updateScoringRule} onRemove={actions.removeScoringRule} />}

      {group.answers.map((answer, answerIndex) => <AnswerEditor key={answer.id} answer={answer} optionLabel={isChoice ? getAnswerOptionLabel(answerIndex) : undefined} selectable={hasMultipleItems} trueFalse={isTrueFalse} showPoint={isTrueFalse ? !group.scoreByCorrectCount : !isChoice || answer.isCorrect} onChange={(changes)=>actions.updateAnswer(answer.id, changes)} onRemove={hasMultipleItems ? ()=>actions.removeAnswer(answer.id) : undefined} />)}
      {hasMultipleItems && <button type="button" onClick={actions.addChoice} className="w-full cursor-pointer rounded-xl border border-dashed border-sky-300 py-2 text-base font-bold text-sky-800 hover:bg-sky-50">+ {isTrueFalse ? 'Thêm câu đúng / sai' : 'Thêm phương án'}</button>}
    </div>
  )
}
export default AnswerGroup
