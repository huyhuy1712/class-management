import { getQuestionScore } from '../../helpers/examScoreUtils'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import AnswerGroup from '../answer/AnswerGroup'
import MediaFilePicker from '../common/MediaFilePicker'
import MathContentInput from '../math/MathContentInput'

function QuestionCard({ question, index, onChange, onRemove, answerActions, validationErrors = {} }) {
  const [collapsed, setCollapsed] = useState(false)
  const hasError = validationErrors[`question-${question.id}`] || question.answerGroups.some((group) => validationErrors[`answer-group-${group.id}`])
  const expanded = !collapsed || Boolean(hasError)
  return (
    <div id={`question-${question.id}`} className={`rounded-[18px] border p-4 shadow-[0_4px_14px_rgba(31,56,45,0.04)] ${validationErrors[`question-${question.id}`] ? 'border-red-300 bg-red-50/60' : 'border-sky-200/80 bg-sky-50/55'}`}>
      <div className={`flex items-center justify-between ${expanded ? 'mb-4' : ''}`}>
        <button type="button" onClick={() => setCollapsed(expanded)} aria-expanded={expanded} aria-controls={`question-body-${question.id}`} className="flex items-center gap-2 rounded-lg py-1 text-base font-bold text-slate-900 hover:text-emerald-700">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />} Câu {index + 1}
          <span className="text-sm font-normal text-slate-500">{expanded ? 'Thu gọn' : 'Mở rộng'}</span>
        </button>
        <button type="button" onClick={onRemove} aria-label={`Xóa câu ${index + 1}`} className="cursor-pointer text-slate-500 hover:text-red-500"><Trash2 size={17}/></button>
      </div>
      <div id={`question-body-${question.id}`} hidden={!expanded}>
      {validationErrors[`question-${question.id}`] && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-base font-semibold text-red-600">{validationErrors[`question-${question.id}`]}</p>}
      <MathContentInput value={question.content} onChange={(content) => onChange({ content })} placeholder="Nhập nội dung câu hỏi..." />
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="w-[140px]"><MediaFilePicker type="image" file={question.imageFile ?? question.imageMedia} onChange={(file) => onChange({ imageFile: file })}/></div>
        <div className="w-[140px]"><MediaFilePicker type="audio" file={question.audioFile ?? question.audioMedia} onChange={(file) => onChange({ audioFile: file })}/></div>
        <div className="min-w-[90px] space-y-1"><p className="text-base font-bold text-slate-700">Điểm câu</p><p className="rounded-lg bg-emerald-50 px-3 py-2 text-lg font-bold text-emerald-800" title="Chỉnh điểm ở Cấu trúc đề thi bên trái">{getQuestionScore(question)} đ</p></div>
        <label className="w-[90px] space-y-1"><span className="text-base font-semibold text-slate-700">Thứ tự</span><input type="number" min="1" value={question.orderIndex} onChange={(e) => onChange({ orderIndex: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-emerald-400"/></label>
      </div>
      <div className="mt-5 space-y-3 border-t border-sky-200/80 pt-4">
        <div className="flex items-center justify-between"><p className="text-base font-bold uppercase tracking-wide text-sky-900">Đáp án · {question.answerGroups.length}</p></div>
        {question.answerGroups.map((group, groupIndex) => <AnswerGroup key={group.id} group={group} index={groupIndex} actions={answerActions(group.id)} error={validationErrors[`answer-group-${group.id}`]} />)}
        <button type="button" onClick={answerActions().addGroup} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 py-2.5 text-base font-semibold text-emerald-800 transition hover:bg-emerald-50"><Plus size={16}/> Thêm đáp án</button>
      </div>
      </div>
    </div>
  )
}
export default QuestionCard
