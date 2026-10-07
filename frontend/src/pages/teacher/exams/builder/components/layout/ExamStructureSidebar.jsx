import { FileText, Plus } from 'lucide-react'

import { getSectionScore } from '../../helpers/examScoreUtils'

function ExamStructureSidebar({ sections, totalScore, onAddSection }) {
  const focusItem = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Cấu trúc đề thi</p>
            <p className="mt-1 text-xs text-slate-400">Tổng điểm: {totalScore}</p>
          </div>
          <FileText size={19} className="text-emerald-600" />
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {sections.map((section, sectionIndex) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => focusItem(`section-${section.id}`)}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-left hover:bg-emerald-50"
              >
                <span className="truncate text-sm font-semibold text-slate-700">
                  {sectionIndex + 1}. {section.title || 'Chưa có tiêu đề'}
                </span>
                <span className="ml-2 text-xs font-bold text-emerald-600">{getSectionScore(section)}đ</span>
              </button>

              <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-2">
                {section.questions.map((question, questionIndex) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => focusItem(`question-${question.id}`)}
                    className="flex w-full cursor-pointer justify-between rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-emerald-700"
                  >
                    <span>Câu {questionIndex + 1}</span>
                    <span>{Number(question.point) || 0}đ</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onAddSection}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          <Plus size={17} />
          Thêm phần
        </button>
      </div>
    </aside>
  )
}

export default ExamStructureSidebar
