import { Flag } from 'lucide-react'
import MathContentInput from '../../../teacher/exams/builder/components/math/MathContentInput'
import MathRenderer from '../../../teacher/exams/builder/components/math/MathRenderer'
import ExamMedia from './ExamMedia'

export default function StudentQuestionCard({ question, number, value, flagged, locked, onChange, onFlag }) {
  return <article id={`question-${question.id}`} className="scroll-mt-32 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-6">
    <header className="mb-4 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-bold text-emerald-800"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs text-emerald-700">{number}</span>Câu {number}</h3>{onFlag && <button type="button" onClick={onFlag} aria-pressed={flagged} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${flagged ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}><Flag size={15} />{flagged ? 'Đã đánh dấu' : 'Xem lại'}</button>}</header>
    <p className="mb-5 text-base leading-7 text-slate-800"><MathRenderer content={question.content} /></p>
    <ExamMedia imageMedia={question.imageMedia} audioMedia={question.audioMedia} />
    {question.groupContent && <p className="mb-4 leading-7 text-slate-700"><MathRenderer content={question.groupContent} /></p>}
    <ExamMedia imageMedia={question.groupImageMedia} audioMedia={question.groupAudioMedia} />
    <fieldset disabled={locked} className="space-y-3">
      <legend className="sr-only">Đáp án câu {number}</legend>
      {question.options?.map((option, index) => {
        const selected = question.type === 'MULTIPLE' ? (value ?? []).includes(index) : value === index
        return <label key={index} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selected ? 'border-emerald-400 bg-emerald-50 text-emerald-900 shadow-sm' : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30'}`}><input type={question.type === 'MULTIPLE' ? 'checkbox' : 'radio'} name={question.id} checked={selected} onChange={() => onChange(question.type === 'MULTIPLE' ? selected ? value.filter((item) => item !== index) : [...(value ?? []), index] : index)} className="accent-green-600" /><span className={`font-semibold ${selected ? 'text-emerald-700' : 'text-slate-500'}`}>{String.fromCharCode(65 + index)}.</span><span className="min-w-0"><MathRenderer content={option} /></span></label>
      })}
      {question.optionRecords?.map((option, index) => (option.imageMedia || option.audioMedia) && <div key={option.id} className="pl-8"><p className="text-xs text-slate-500">Đáp án {String.fromCharCode(65 + index)}</p><ExamMedia {...option} /></div>)}
      {question.type === 'TRUE_FALSE' && question.statements.map((statement, index) => <div key={index} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><p className="min-w-0 flex-1 text-sm">{String.fromCharCode(97 + index)}. <MathRenderer content={statement} /></p><div className="flex gap-3">{[true, false].map((choice) => <label key={String(choice)} className="flex items-center gap-1.5 text-sm"><input type="radio" name={`${question.id}-${index}`} checked={value?.[index] === choice} onChange={() => onChange({ ...value, [index]: choice })} className="accent-green-600" />{choice ? 'Đúng' : 'Sai'}</label>)}</div></div>)}
      {question.type === 'SHORT' && <MathContentInput ariaLabel={`Đáp án câu ${number}`} value={value ?? ''} onChange={onChange} rows={1} maxLength={20000} readOnly={locked} placeholder="Nhập đáp án của bạn..." />}
      {question.type === 'ESSAY' && <><MathContentInput ariaLabel={`Bài viết câu ${number}`} value={value ?? ''} onChange={onChange} rows={6} maxLength={10000} readOnly={locked} placeholder="Viết câu trả lời tại đây..." /><p className="text-right text-xs text-slate-400">{value?.length ?? 0}/10000 ký tự</p></>}
    </fieldset>
  </article>
}
