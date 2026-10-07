import { Trash2 } from 'lucide-react'
import AnswerEditor from '../answer/AnswerEditor'
import AnswerTypeSelector from '../answer/AnswerTypeSelector'
import MediaFilePicker from '../common/MediaFilePicker'
import MathContentInput from '../math/MathContentInput'

function QuestionCard({ question, index, onChange, onRemove, onSetAnswerType, onSetChoiceCount, onSetChoiceMode, onAddAnswer, onUpdateAnswer, onRemoveAnswer }) {
  const isChoice = question.answerMode === 'CHOICE'
  return (
    <div id={`question-${question.id}`} className="rounded-[18px] border border-slate-200/80 bg-slate-50/70 p-4 shadow-[0_4px_14px_rgba(31,56,45,0.04)]">
      <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-slate-800">Câu {index + 1}</p><button type="button" onClick={onRemove} className="cursor-pointer text-slate-400 hover:text-red-500"><Trash2 size={17}/></button></div>
      <MathContentInput value={question.content} onChange={(content) => onChange({ content })} placeholder="Nhập nội dung câu hỏi..." />
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="w-[140px]"><MediaFilePicker type="image" file={question.imageFile} onChange={(file) => onChange({ imageFile: file })}/></div>
        <div className="w-[140px]"><MediaFilePicker type="audio" file={question.audioFile} onChange={(file) => onChange({ audioFile: file })}/></div>
        <label className="w-[90px] space-y-1"><span className="text-[10px] font-semibold text-slate-500">Điểm</span><input type="number" min="0" value={question.point} onChange={(e) => onChange({ point: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-emerald-400"/></label>
        <label className="w-[90px] space-y-1"><span className="text-[10px] font-semibold text-slate-500">Thứ tự</span><input type="number" min="1" value={question.orderIndex} onChange={(e) => onChange({ orderIndex: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-emerald-400"/></label>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Đáp án</p>
        {!question.answerMode ? <AnswerTypeSelector onSelect={onSetAnswerType}/> : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
              <span className="text-sm font-bold text-emerald-800">{isChoice ? 'Trắc nghiệm' : question.answerMode === 'TRUE_FALSE' ? 'Đúng / Sai' : question.answerMode === 'SHORT_ANSWER' ? 'Trả lời ngắn' : 'Văn bản'}</span>
              <button type="button" onClick={() => onSetAnswerType(null)} className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-emerald-700">Đổi kiểu đáp án</button>
            </div>
            {isChoice && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                  <label>
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Số phương án</span>
                    <input type="number" min="2" max="50" value={question.answers.length || ''} onChange={(e) => onSetChoiceCount(e.target.value)} placeholder="Nhập số lượng" className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                  </label>
                  <div>
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Nhiều đáp án đúng</span>
                    <div className="flex min-h-[42px] items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/80 px-3">
                      <button type="button" role="switch" aria-checked={question.choiceMode === 'MULTIPLE'} onClick={() => onSetChoiceMode(question.choiceMode === 'MULTIPLE' ? 'SINGLE' : 'MULTIPLE')} className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${question.choiceMode === 'MULTIPLE' ? 'bg-violet-500' : 'bg-slate-300'}`}>
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${question.choiceMode === 'MULTIPLE' ? 'left-6' : 'left-1'}`} />
                      </button>
                      <div><p className="text-xs font-bold text-slate-700">{question.choiceMode === 'MULTIPLE' ? 'Đang bật' : 'Đang tắt'}</p><p className="text-[11px] text-slate-500">{question.choiceMode === 'MULTIPLE' ? 'Có thể chọn nhiều phương án đúng.' : 'Chỉ được chọn một phương án đúng.'}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {question.answers.map((answer) => <AnswerEditor key={answer.id} answer={answer} selectable={isChoice || question.answerMode==='TRUE_FALSE'} onChange={(changes)=>onUpdateAnswer(answer.id,changes)} onRemove={question.answerMode === 'TRUE_FALSE' ? undefined : ()=>onRemoveAnswer(answer.id)}/>)}
            {question.answerMode !== 'TRUE_FALSE' && (
              <button type="button" onClick={onAddAnswer} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                + Thêm đáp án
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default QuestionCard
