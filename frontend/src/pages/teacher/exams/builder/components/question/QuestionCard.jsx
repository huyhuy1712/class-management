import { Trash2 } from 'lucide-react'

import AnswerEditor from '../answer/AnswerEditor'
import AnswerTypeSelector from '../answer/AnswerTypeSelector'

function QuestionCard({
  question,
  index,
  onChange,
  onRemove,
  onAddAnswer,
  onUpdateAnswer,
  onRemoveAnswer,
}) {
  return (
    <div id={`question-${question.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800">Câu {index + 1}</p>
        <button type="button" onClick={onRemove} className="cursor-pointer text-slate-400 hover:text-red-500">
          <Trash2 size={17} />
        </button>
      </div>

      <textarea
        value={question.content}
        onChange={(event) => onChange({ content: event.target.value })}
        rows={3}
        placeholder="Nhập nội dung câu hỏi..."
        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
      />

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <input value={question.imageUrl} onChange={(e) => onChange({ imageUrl: e.target.value })} placeholder="Image URL" className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none" />
        <input value={question.audioUrl} onChange={(e) => onChange({ audioUrl: e.target.value })} placeholder="Audio URL" className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none" />
        <input type="number" min="0" value={question.point} onChange={(e) => onChange({ point: e.target.value })} placeholder="Điểm" className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none" />
        <input type="number" min="1" value={question.orderIndex} onChange={(e) => onChange({ orderIndex: e.target.value })} placeholder="Thứ tự" className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none" />
        <select value={question.scoringType} onChange={(e) => onChange({ scoringType: e.target.value })} className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none lg:col-span-1">
          <option value="PER_QUESTION">Chấm theo câu</option>
          <option value="PER_CORRECT_ANSWER">Theo số câu đúng</option>
        </select>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Đáp án</p>
        {question.answers.map((answer) => (
          <AnswerEditor
            key={answer.id}
            answer={answer}
            onChange={(changes) => onUpdateAnswer(answer.id, changes)}
            onRemove={() => onRemoveAnswer(answer.id)}
          />
        ))}
        <AnswerTypeSelector onSelect={onAddAnswer} />
      </div>
    </div>
  )
}

export default QuestionCard
