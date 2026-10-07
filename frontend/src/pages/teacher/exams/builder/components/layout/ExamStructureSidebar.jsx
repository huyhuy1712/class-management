import { FileText, Plus, X } from 'lucide-react'

import { getSectionScore } from '../../helpers/examScoreUtils'

function ExamStructureSidebar({ sections, totalScore, onAddSection, onRemoveSection, onRemoveQuestion, onUpdateQuestion }) {
  const focusItem = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <aside className="min-h-0 lg:h-full">
      <div className="flex h-full min-h-0 flex-col rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_25px_rgba(31,56,45,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Cấu trúc đề thi</p>
            <p className="mt-1 text-xs text-slate-400">Tổng điểm: {totalScore}</p>
          </div>
          <FileText size={19} className="text-emerald-600" />
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-color:#bbf7d0_transparent] [scrollbar-width:thin]">
          {sections.map((section, sectionIndex) => (
            <div key={section.id}>
              <div className="group flex items-center rounded-xl border border-transparent bg-slate-50 transition hover:border-emerald-100 hover:bg-emerald-50">
                <button type="button" onClick={() => focusItem(`section-${section.id}`)} className="flex min-w-0 flex-1 cursor-pointer items-center justify-between px-3 py-2.5 text-left">
                  <span className="truncate text-sm font-semibold text-slate-700">{sectionIndex + 1}. {section.title || 'Chưa có tiêu đề'}</span>
                  <span className="ml-2 shrink-0 text-xs font-bold text-emerald-600">{getSectionScore(section)}đ</span>
                </button>
                <button type="button" title="Xóa phần" onClick={() => onRemoveSection(section.id)} className="mr-2 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                  <X size={15} />
                </button>
              </div>

              <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-2">
                {section.questions.map((question, questionIndex) => (
                  <div key={question.id}>
                  <div className="group flex items-center rounded-lg transition hover:bg-slate-50">
                    <button type="button" onClick={() => focusItem(`question-${question.id}`)} className="flex min-w-0 flex-1 cursor-pointer justify-between px-2 py-1.5 text-xs text-slate-500 hover:text-emerald-700">
                      <span>Câu {questionIndex + 1}</span>
                      <label className="ml-auto flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <input type="number" min="0" step="0.25" value={question.point} onChange={(e) => onUpdateQuestion(section.id, question.id, { point: e.target.value })} className="w-12 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-right text-xs font-semibold text-slate-500 outline-none hover:border-emerald-200 focus:border-emerald-300 focus:bg-white" />
                        <span>đ</span>
                      </label>
                    </button>
                    <button type="button" title="Xóa câu hỏi" onClick={() => onRemoveQuestion(section.id, question.id)} className="mr-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-300 transition hover:bg-red-50 hover:text-red-500">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="ml-4 space-y-0.5 border-l border-slate-100 pl-2">
                    {(question.answerGroups ?? []).map((group, groupIndex) => (
                      <button key={group.id} type="button" onClick={() => focusItem(`answer-group-${group.id}`)} className="block w-full cursor-pointer truncate rounded-md px-2 py-1 text-left text-[11px] text-slate-400 hover:bg-emerald-50 hover:text-emerald-700">
                        Đáp án {groupIndex + 1} · {group.answerType === 'CHOICE' ? 'Trắc nghiệm' : group.answerType === 'TRUE_FALSE' ? 'Đúng / Sai' : group.answerType === 'SHORT_ANSWER' ? 'Trả lời ngắn' : group.answerType === 'TEXT' ? 'Văn bản' : 'Chưa chọn kiểu'}
                      </button>
                    ))}
                  </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={onAddSection} className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
          <Plus size={17} /> Thêm phần
        </button>
      </div>
    </aside>
  )
}

export default ExamStructureSidebar
