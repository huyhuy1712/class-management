import { Trash2 } from 'lucide-react'
import AnswerEditor from '../answer/AnswerEditor'
import AnswerTypeSelector from '../answer/AnswerTypeSelector'
import MediaFilePicker from '../common/MediaFilePicker'

function QuestionCard({ question, index, onChange, onRemove, onSetAnswerType, onSetChoiceCount, onSetChoiceMode, onUpdateAnswer, onRemoveAnswer }) {
  const isChoice = question.answerMode === 'CHOICE'
  return (
    <div id={`question-${question.id}`} className="rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-[0_4px_14px_rgba(31,56,45,0.04)]">
      <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-slate-800">Câu {index + 1}</p><button type="button" onClick={onRemove} className="cursor-pointer text-slate-400 hover:text-red-500"><Trash2 size={17}/></button></div>
      <textarea value={question.content} onChange={(e) => onChange({ content: e.target.value })} rows={3} placeholder="Nhập nội dung câu hỏi..." className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"/>
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
            {isChoice && <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
              <label><span className="mb-1 block text-xs font-semibold text-slate-600">Số phương án</span><select value={question.answers.length} onChange={(e) => onSetChoiceCount(e.target.value)} className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400">{[2,3,4,5,6,7,8,9,10].map((n)=><option key={n} value={n}>{n} phương án</option>)}</select></label>
              <div><span className="mb-1 block text-xs font-semibold text-slate-600">Số đáp án đúng</span><div className="flex rounded-lg border border-slate-200 bg-white p-1"><button type="button" onClick={()=>onSetChoiceMode('SINGLE')} className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${question.choiceMode==='SINGLE'?'bg-emerald-500 text-white':'text-slate-500'}`}>1 đáp án đúng</button><button type="button" onClick={()=>onSetChoiceMode('MULTIPLE')} className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${question.choiceMode==='MULTIPLE'?'bg-emerald-500 text-white':'text-slate-500'}`}>Nhiều đáp án đúng</button></div></div>
            </div>}
            {question.answers.map((answer) => <AnswerEditor key={answer.id} answer={answer} selectable={isChoice || question.answerMode==='TRUE_FALSE'} onChange={(changes)=>onUpdateAnswer(answer.id,changes)} onRemove={isChoice ? undefined : ()=>onRemoveAnswer(answer.id)}/>)}
          </div>
        )}
      </div>
    </div>
  )
}
export default QuestionCard
