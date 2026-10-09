import { Plus, Trash2 } from 'lucide-react'

import { getSectionScore } from '../../helpers/examScoreUtils'
import MathContentInput from '../math/MathContentInput'
import QuestionCard from '../question/QuestionCard'
import MediaFilePicker from '../common/MediaFilePicker'

function SectionCard({ section, index, actions, validationErrors = {} }) {
  const score = getSectionScore(section)

  return (
    <section id={`section-${section.id}`} className="overflow-hidden rounded-[20px] border border-emerald-200/80 bg-emerald-50/35 shadow-[0_5px_18px_rgba(31,56,45,0.04)]">
      <div className="border-b border-emerald-100 bg-emerald-50/70 p-5">
        {validationErrors[`section-${section.id}`] && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-base font-semibold text-red-600">{validationErrors[`section-${section.id}`]}</p>}
      <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-base font-bold uppercase tracking-wider text-emerald-800">Phần {index + 1}</p>
            <p className="mt-1 text-base font-semibold text-slate-700">{score} điểm · {section.questions.length} câu hỏi</p>
          </div>
          <button type="button" onClick={() => actions.removeSection(section.id)} className="cursor-pointer text-slate-400 hover:text-red-500">
            <Trash2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input value={section.title} onChange={(e) => actions.updateSection(section.id, { title: e.target.value })} placeholder="Tên section" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
          <MediaFilePicker type="image" file={section.imageFile ?? section.imageMedia} onChange={(file) => actions.updateSection(section.id, { imageFile: file })} />
          <MediaFilePicker type="audio" file={section.audioFile ?? section.audioMedia} onChange={(file) => actions.updateSection(section.id, { audioFile: file })} />
          <input type="number" min="1" value={section.orderIndex} onChange={(e) => actions.updateSection(section.id, { orderIndex: e.target.value })} placeholder="Thứ tự" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none" />
        </div>
        <div className="mt-5">
          <h3 className="mb-1 text-base font-semibold text-slate-800">Đoạn văn của phần <span className="text-sm font-normal text-slate-500">(không bắt buộc)</span></h3>
          <p className="mb-3 text-sm text-slate-600">Nhập đoạn đọc, hướng dẫn hoặc nội dung chung cho các câu hỏi trong phần này.</p>
          <MathContentInput value={section.paragraph ?? ''} onChange={(paragraph) => actions.updateSection(section.id, { paragraph })} rows={5} placeholder="Nhập đoạn văn chung cho phần này... Bấm vào để mở rộng vùng viết." />
        </div>
      </div>

      <div className="space-y-4 bg-emerald-50/25 p-5">
        {section.questions.map((question, questionIndex) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={questionIndex}
            onChange={(changes) => actions.updateQuestion(section.id, question.id, changes)}
            onRemove={() => actions.removeQuestion(section.id, question.id)}
            validationErrors={validationErrors}
            answerActions={(groupId) => ({
              addGroup: () => actions.addAnswerGroup(section.id, question.id),
              remove: () => actions.removeAnswerGroup(section.id, question.id, groupId),
              setType: (type) => actions.setAnswerGroupType(section.id, question.id, groupId, type),
              setChoiceCount: (count) => actions.setGroupChoiceCount(section.id, question.id, groupId, count),
              setChoiceMode: (mode) => actions.setGroupChoiceMode(section.id, question.id, groupId, mode),
              addChoice: () => actions.addGroupChoice(section.id, question.id, groupId),
              updateAnswer: (answerId, changes) => actions.updateGroupAnswer(section.id, question.id, groupId, answerId, changes),
              removeAnswer: (answerId) => actions.removeGroupAnswer(section.id, question.id, groupId, answerId),
              updateGroup: (changes) => actions.updateAnswerGroup(section.id, question.id, groupId, changes),
              addScoringRule: () => actions.addScoringRule(section.id, question.id, groupId),
              updateScoringRule: (ruleId, changes) => actions.updateScoringRule(section.id, question.id, groupId, ruleId, changes),
              removeScoringRule: (ruleId) => actions.removeScoringRule(section.id, question.id, groupId, ruleId),
            })}
          />
        ))}

        <button
          type="button"
          onClick={() => actions.addQuestion(section.id)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-base font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <Plus size={17} />
          Thêm câu hỏi
        </button>
      </div>
    </section>
  )
}

export default SectionCard
