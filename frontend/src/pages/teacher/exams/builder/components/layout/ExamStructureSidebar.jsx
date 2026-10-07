import { ChevronDown, ChevronRight, FileText, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { getSectionScore } from '../../helpers/examScoreUtils'

const answerTypeLabel = (type) => type === 'CHOICE' ? 'Trắc nghiệm' : type === 'TRUE_FALSE' ? 'Đúng / Sai' : type === 'SHORT_ANSWER' ? 'Trả lời ngắn' : type === 'TEXT' ? 'Văn bản' : 'Chưa chọn kiểu'

function ExamStructureSidebar({ sections, totalScore, onAddSection, onRemoveSection, onRemoveQuestion, onUpdateQuestion, onRemoveAnswerGroup }) {
  const [collapsedSections, setCollapsedSections] = useState({})
  const [collapsedQuestions, setCollapsedQuestions] = useState({})
  const focusItem = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const toggle = (setter, id) => setter((current) => ({ ...current, [id]: !current[id] }))

  return (
    <aside className="min-h-0 lg:h-full">
      <div className="flex h-full min-h-0 flex-col rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_25px_rgba(31,56,45,0.05)]">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-slate-900">Cấu trúc đề thi</p><p className="mt-1 text-xs text-slate-400">Tổng điểm: {totalScore}</p></div><FileText size={19} className="text-emerald-600"/></div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-color:#bbf7d0_transparent] [scrollbar-width:thin]">
          {sections.map((section, sectionIndex) => {
            const sectionCollapsed = collapsedSections[section.id]
            return <div key={section.id}>
              <div className="flex items-center rounded-xl bg-slate-50 hover:bg-emerald-50">
                <button type="button" onClick={() => toggle(setCollapsedSections, section.id)} className="ml-2 cursor-pointer text-slate-400">{sectionCollapsed ? <ChevronRight size={15}/> : <ChevronDown size={15}/>}</button>
                <button type="button" onClick={() => focusItem(`section-${section.id}`)} className="flex min-w-0 flex-1 cursor-pointer items-center justify-between px-2 py-2.5 text-left"><span className="truncate text-sm font-semibold text-slate-700">{sectionIndex + 1}. {section.title || 'Chưa có tiêu đề'}</span><span className="ml-2 text-xs font-bold text-emerald-600">{getSectionScore(section)}đ</span></button>
                <button type="button" onClick={() => onRemoveSection(section.id)} className="mr-2 cursor-pointer text-slate-400 hover:text-red-500"><X size={15}/></button>
              </div>
              {!sectionCollapsed && <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-2">
                {section.questions.map((question, questionIndex) => {
                  const questionCollapsed = collapsedQuestions[question.id]
                  return <div key={question.id}>
                    <div className="flex items-center rounded-lg hover:bg-slate-50">
                      <button type="button" onClick={() => toggle(setCollapsedQuestions, question.id)} className="ml-1 cursor-pointer text-slate-300">{questionCollapsed ? <ChevronRight size={13}/> : <ChevronDown size={13}/>}</button>
                      <button type="button" onClick={() => focusItem(`question-${question.id}`)} className="flex min-w-0 flex-1 cursor-pointer items-center px-1.5 py-1.5 text-xs text-slate-500 hover:text-emerald-700"><span>Câu {questionIndex + 1}</span></button>
                      <label className="flex items-center gap-0.5"><input type="number" min="0" step="0.25" value={question.point} onChange={(e)=>onUpdateQuestion(section.id, question.id, { point: e.target.value })} className="w-10 rounded border border-transparent bg-transparent text-right text-xs outline-none focus:border-emerald-300"/><span className="text-xs text-slate-500">đ</span></label>
                      <button type="button" onClick={()=>onRemoveQuestion(section.id, question.id)} className="mx-1 cursor-pointer text-slate-300 hover:text-red-500"><X size={13}/></button>
                    </div>
                    {!questionCollapsed && <div className="ml-5 space-y-0.5 border-l border-slate-100 pl-2">
                      {(question.answerGroups ?? []).map((group, groupIndex) => <div key={group.id} className="flex items-center rounded-md hover:bg-emerald-50">
                        <button type="button" onClick={()=>focusItem(`answer-group-${group.id}`)} className="min-w-0 flex-1 cursor-pointer truncate px-2 py-1 text-left text-[11px] text-slate-400 hover:text-emerald-700">Đáp án {groupIndex + 1} · {answerTypeLabel(group.answerType)}</button>
                        <button type="button" title="Xóa đáp án" onClick={()=>onRemoveAnswerGroup(section.id, question.id, group.id)} className="mr-1 cursor-pointer rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"><X size={12}/></button>
                      </div>)}
                    </div>}
                  </div>
                })}
              </div>}
            </div>
          })}
        </div>
        <button type="button" onClick={onAddSection} className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"><Plus size={17}/> Thêm phần</button>
      </div>
    </aside>
  )
}
export default ExamStructureSidebar
