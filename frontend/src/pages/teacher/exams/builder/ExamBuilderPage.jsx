import { ScoringRuleTemplatesProvider } from './components/answer/ScoringRuleTemplates'
import { ArrowLeft, Plus, Save } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import ExamStructureSidebar from './components/layout/ExamStructureSidebar'
import SectionCard from './components/section/SectionCard'
import useExamBuilder from './hooks/useExamBuilder'
import { loadExamDraft, saveExamDraft } from '../draft/examDraftStorage'
import useSaveExam from './hooks/useSaveExam'
import ExamSaveStatus from './components/layout/ExamSaveStatus'
import { getExamConfig } from './helpers/examPayload'

function ExamBuilderPage({ editingExam, onSaveChanges } = {}) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const isEditing = Boolean(editingExam)
  const builder = useExamBuilder({ initialSections: editingExam?.sections, persistDraft: !isEditing })
  const [validationErrors, setValidationErrors] = useState({})
  const draft = isEditing ? null : loadExamDraft()
  const examConfig = isEditing ? editingExam : getExamConfig(draft, state?.examConfig)
  const [draftMessage, setDraftMessage] = useState('')
  const saveExam = useSaveExam({ enabled: !isEditing, builder, routeConfig: state?.examConfig, onValidationErrors: setValidationErrors })

  const handleSaveDraft = () => {
    const saved = saveExamDraft({ builder: { sections: builder.sections } })
    setDraftMessage(saved ? 'Đã giữ bản nháp trên trình duyệt. File ảnh và audio  cần chọn lại nếu tải lại trang.' : 'Không thể lưu bản nháp trên trình duyệt.')
  }

  return (
    <ScoringRuleTemplatesProvider>
    <DashboardLayout>
      <div className="exam-builder min-h-[calc(100vh-76px)] bg-[#f6f8f7]">
        <div className="flex w-full min-w-0 flex-col px-3 py-3 sm:px-4 lg:px-5">
          <header className="mb-3 flex shrink-0 flex-col gap-4 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(31,56,45,0.05)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button type="button" disabled={saveExam.saving} onClick={() => navigate(isEditing ? '/teacher/exams' : '/teacher/exams/create')} className="mb-2 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-700 transition hover:text-emerald-700">
                <ArrowLeft size={17} />
                {isEditing ? 'Quay lại danh sách đề thi' : 'Quay lại cấu hình'}
              </button>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#18301d]">{examConfig?.title || 'Tạo nội dung đề thi'}</h1>
              <p className="mt-1 text-sm text-slate-700">Xây dựng section, câu hỏi và đáp án cho đề thi.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-sm font-bold text-emerald-700">
                Tổng điểm: {builder.totalScore}
              </div>
              {!isEditing && <button type="button" disabled={saveExam.saving} onClick={handleSaveDraft} className="flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50">
                <Save size={17} />
                Giữ nháp
              </button>}
              <button type="button" disabled={!isEditing && (saveExam.saving || saveExam.uncertain)} onClick={isEditing ? () => { onSaveChanges(builder.sections); setDraftMessage('Đã giữ chỉnh sửa trong phiên màn hình. Chưa cập nhật lên máy chủ.') } : saveExam.save} className="rounded-xl bg-[#159a68] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#11845a] disabled:opacity-50">
                {isEditing ? 'Lưu chỉnh sửa' : saveExam.saving ? 'Đang lưu...' : 'Lưu đề thi'}
              </button>
            </div>
          </header>

          {isEditing ? <div className="mb-4 text-sm text-slate-600"><p>Mã đề: {editingExam.code || '—'} · Trạng thái: {editingExam.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}</p>{draftMessage && <p role="status" className="mt-1">{draftMessage}</p>}</div> : <ExamSaveStatus config={examConfig} message={saveExam.message || draftMessage} uncertain={saveExam.uncertain} saving={saveExam.saving} onConfirmRetry={saveExam.confirmRetry} />}
          <fieldset disabled={saveExam.saving} className="grid min-w-0 grid-cols-1 items-start gap-3 lg:grid-cols-[285px_minmax(0,1fr)]">
            <ExamStructureSidebar
              sections={builder.sections}
              totalScore={builder.totalScore}
              onAddSection={builder.addSection}
              onRemoveSection={builder.removeSection}
              onRemoveQuestion={builder.removeQuestion}
              onUpdateQuestionScore={builder.updateQuestionScore}
              onRemoveAnswerGroup={builder.removeAnswerGroup}
              validationErrors={validationErrors}
            />

            <main id="builder-root" className="max-h-[240vh] min-w-0 overflow-y-auto rounded-[22px] border border-slate-200/80 bg-slate-100/70 p-3 pr-2 shadow-[0_8px_24px_rgba(31,56,45,0.04)] [scrollbar-color:#a7d9bf_transparent] [scrollbar-width:thin] sm:p-4">
              {validationErrors['builder-root'] && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{validationErrors['builder-root']}</div>}
              {builder.sections.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Plus size={26} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Bắt đầu xây dựng đề thi</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-700">
                    Tạo phần đầu tiên, sau đó thêm câu hỏi và chọn kiểu đáp án phù hợp cho từng câu.
                  </p>
                  <button type="button" onClick={builder.addSection} className="mt-5 flex cursor-pointer items-center gap-2 rounded-xl bg-[#159a68] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#11845a]">
                    <Plus size={17} />
                    Thêm section đầu tiên
                  </button>
                </div>
              ) : (
                builder.sections.map((section, index) => (
                  <SectionCard key={section.id} section={section} index={index} actions={builder}
              validationErrors={validationErrors} />
                ))
              )}
              {builder.sections.length > 0 && (
                <button type="button" onClick={builder.addSection} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-100">
                  <Plus size={18} /> Thêm phần
                </button>
              )}
            </main>
          </fieldset>
        </div>
      </div>
    </DashboardLayout>
    </ScoringRuleTemplatesProvider>
  )
}

export default ExamBuilderPage
