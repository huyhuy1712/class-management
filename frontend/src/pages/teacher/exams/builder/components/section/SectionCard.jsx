import { Plus, Trash2 } from 'lucide-react'

import { getSectionScore } from '../../helpers/examScoreUtils'
import QuestionCard from '../question/QuestionCard'
import MediaFilePicker from '../common/MediaFilePicker'

function SectionCard({ section, index, actions }) {
  const score = getSectionScore(section)

  return (
    <section id={`section-${section.id}`} className="overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_5px_18px_rgba(31,56,45,0.04)]">
      <div className="border-b border-slate-100 bg-[#fbfcfb] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Phần {index + 1}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{score} điểm · {section.questions.length} câu hỏi</p>
          </div>
          <button type="button" onClick={() => actions.removeSection(section.id)} className="cursor-pointer text-slate-400 hover:text-red-500">
            <Trash2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input value={section.title} onChange={(e) => actions.updateSection(section.id, { title: e.target.value })} placeholder="Tên section" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
          <MediaFilePicker type="image" file={section.imageFile} onChange={(file) => actions.updateSection(section.id, { imageFile: file })} />
          <MediaFilePicker type="audio" file={section.audioFile} onChange={(file) => actions.updateSection(section.id, { audioFile: file })} />
          <input type="number" min="1" value={section.orderIndex} onChange={(e) => actions.updateSection(section.id, { orderIndex: e.target.value })} placeholder="Thứ tự" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none" />
        </div>
      </div>

      <div className="space-y-4 p-5">
        {section.questions.map((question, questionIndex) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={questionIndex}
            onChange={(changes) => actions.updateQuestion(section.id, question.id, changes)}
            onRemove={() => actions.removeQuestion(section.id, question.id)}
            onAddAnswer={(type) => actions.addAnswer(section.id, question.id, type)}
            onUpdateAnswer={(answerId, changes) => actions.updateAnswer(section.id, question.id, answerId, changes)}
            onRemoveAnswer={(answerId) => actions.removeAnswer(section.id, question.id, answerId)}
          />
        ))}

        <button
          type="button"
          onClick={() => actions.addQuestion(section.id)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Plus size={17} />
          Thêm câu hỏi
        </button>
      </div>
    </section>
  )
}

export default SectionCard
