import { Trash2 } from 'lucide-react'

import AnswerEditor from '../answer/AnswerEditor'
import AnswerTypeSelector from '../answer/AnswerTypeSelector'
import MediaFilePicker from '../common/MediaFilePicker'

function QuestionCard({ question, index, onChange, onRemove, onAddAnswer, onUpdateAnswer, onRemoveAnswer }) {
  return (
    <div id={`question-${question.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800">Câu {index + 1}</p>
        <button type="button" onClick={onRemove} className="cursor-pointer text-slate-400 hover:text-red-500"><Trash2 size={17} /></button>
      </div>

      <textarea value={question.content} onChange={(e) => onChange({ content: e.target.value })} rows={3} placeholder="Nhập nội dung câu hỏi..." className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_0.65fr_0.65fr_1.35fr]">
        <MediaFilePicker type="image" file={question.imageFile} onChange={(file) => onChange({ imageFile: file })} />
        <MediaFilePicker type="audio" file={question.audioFile} onChange={(file) => onChange({ audioFile: file })} />

        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Điểm</span>
          <input type="number" min="0" value={question.point} onChange={(e) => onChange({ point: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Thứ tự</span>
          <input type="number" min="1" value={question.orderIndex} onChange={(e) => onChange({ orderIndex: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
        </label>

        <label className="space-y-1 sm:col-span-2 xl:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500">Cách chấm điểm</span>
          <select value={question.scoringType} onChange={(e) => onChange({ scoringType: e.target.value })} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400">
            <option value="PER_QUESTION">Chấm theo từng câu</option>
            <option value="PER_CORRECT_ANSWER">Chấm theo số đáp án đúng</option>
          </select>
        </label>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Đáp án</p>
        {question.answers.map((answer) => (
          <AnswerEditor key={answer.id} answer={answer} onChange={(changes) => onUpdateAnswer(answer.id, changes)} onRemove={() => onRemoveAnswer(answer.id)} />
        ))}
        <AnswerTypeSelector onSelect={onAddAnswer} />
      </div>
    </div>
  )
}

export default QuestionCard
