import FrogLoading from '../../../../utils/FrogLoading'
import useExamTargetOptions from '../hooks/useExamTargetOptions'
import { Modal } from 'antd'
import useSaveExamConfiguration from '../hooks/useSaveExamConfiguration'
import useExamResource from '../hooks/useExamResource'
import { getExamConfigurationForm } from '../helpers/examConfigurationForm'
import { focusConfigurationError } from '../helpers/examConfigurationErrors'
import { useRef, useState } from 'react'
import useCreateExamForm from '../create/hooks/useCreateExamForm'
import ExamBasicInfoSection from '../create/components/ExamBasicInfoSection'
import ExamSettingsSection from '../create/components/ExamSettingsSection'
import ExamResultSettingsSection from '../create/components/ExamResultSettingsSection'
import ExamAccessSection from '../create/components/ExamAccessSection'

function ExamConfiguration({ exam, onClose, saveState, mode }) {
  const newAssignment = mode === 'reassign'
  const formRef = useRef(null)
  const published = exam.status === 'PUBLISHED'
  const missingAssignment = !newAssignment && exam.assignments?.length === 0
  const locked = newAssignment
    ? exam.status !== 'PUBLISHED'
    : exam.status !== 'DRAFT' || (!missingAssignment && exam.assignment?.status !== 'DRAFT')
  const { saving, save, error: saveError } = saveState
  const { loading, error, ...options } = useExamTargetOptions()
  const initialConfig = {
    ...getExamConfigurationForm(exam),
    ...(missingAssignment ? { accessType: 'CLASS', classIds: [] } : {}),
  }
  const editor = useCreateExamForm({ ...options, initialConfig: newAssignment ? { ...initialConfig, threshold: exam.assignment?.threshold, timeLimit: exam.assignment?.timeLimit ?? initialConfig.timeLimit, maxAttempts: exam.assignment?.maxAttempts ?? initialConfig.maxAttempts, openTime: '', closeTime: '' } : initialConfig, persistDraft: false })
  return <form ref={formRef} className="flex min-h-0 flex-col overflow-hidden" style={{ height: 'min(720px, calc(100dvh - 160px))' }} onSubmit={(event) => { event.preventDefault(); if (!locked && !saving && !loading && !error && editor.validate()) save(editor.buildExamData(), exam, (errors) => { editor.setErrors(errors); focusConfigurationError(formRef.current, errors) }) }}>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2" style={{ scrollbarGutter: 'stable' }}>
    {published && !newAssignment && <p role="note" className="mb-3 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">Bài thi đã xuất bản không thể chỉnh sửa.</p>}
    {newAssignment && <p role="note" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Mở đợt mới cho đề <strong>{initialConfig.title}</strong>. Đợt mới có lượt làm và kết quả riêng; các đợt cũ được giữ nguyên. HS đã xem đáp án ở đợt cũ có thể biết lời giải.</p>}
    {missingAssignment && <p role="note" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Đề nháp chưa có lần giao. Khi lưu, hệ thống sẽ tạo một lần giao nháp mới; đề chưa được giao cho học sinh cho đến khi bạn chọn đối tượng và xuất bản.</p>}
    {locked && !published && !missingAssignment && <p role="note" className="mb-3 text-sm text-amber-700">Đề đang ở trạng thái nháp nhưng lần giao đang ở trạng thái {exam.assignment?.status ?? 'không xác định'}. Chỉ lần giao nháp mới được sửa cấu hình.</p>}
    {saveError && <p role="alert" className="mb-4 text-red-600">{saveError}</p>}
    {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
    <fieldset disabled={locked || saving} className="m-0 min-w-0 space-y-4 border-0 p-0 disabled:opacity-75">
      {!newAssignment && <ExamBasicInfoSection form={editor.form} errors={editor.errors} onChange={editor.handleChange} subjects={options.subjects} subjectsLoading={options.subjectsLoading} subjectsError={options.subjectsError} onRetrySubjects={options.retrySubjects} />}
      <ExamSettingsSection form={editor.form} errors={editor.errors} onChange={editor.handleChange} />
      <ExamResultSettingsSection form={editor.form} errors={editor.errors} onChange={editor.handleChange} />
      <ExamAccessSection form={editor.form} errors={editor.errors} onChange={editor.handleChange} error={editor.errors.accessType} accessType={editor.accessType} onAccessChange={editor.handleAccessChange} classes={editor.filteredClasses} classCount={options.classes.length} classesLoading={options.classesLoading} classesError={options.classesError} selectedClasses={editor.selectedClasses} classSearch={editor.classSearch} onClassSearchChange={editor.setClassSearch} onToggleClass={editor.toggleClass} students={editor.studentsInSelectedClass} selectedStudentClassId={editor.selectedStudentClassId} selectedStudents={editor.selectedStudents} studentSearch={editor.studentSearch} onStudentSearchChange={editor.setStudentSearch} onToggleStudent={editor.toggleStudent} onStudentClassChange={editor.setSelectedStudentClassId} />
    </fieldset>
    </div>
    <div className="mt-4 flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white pt-4"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5">Hủy</button><button type="submit" disabled={locked || saving || loading || Boolean(error) || (editor.accessType === 'ALL' && options.classes.length === 0)} className="rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? <FrogLoading compact label="Đang lưu..." /> : newAssignment ? 'Mở đợt thi mới' : 'Lưu cấu hình'}</button></div>
  </form>
}

function LoadedConfiguration({ exam, onClose, saveState, mode }) {
  const { data, loading, error, retry } = useExamResource(exam.id, 'configuration')
  const [assignmentId, setAssignmentId] = useState('')
  if (loading) return <FrogLoading label="Đang tải cấu hình đề thi..." className="p-6" />
  if (error) return <div className="p-6"><p role="alert" className="text-red-600">{error}</p><button type="button" onClick={retry} className="mt-3 text-emerald-700">Thử lại</button></div>
  const assignments = data.assignments ?? []
  const assignment = assignments.find((item) => String(item.id) === assignmentId)
    ?? assignments.find((item) => item.status === 'DRAFT')
    ?? assignments[0]
  const configuration = { ...data, assignments, assignment, status: data.status === 'PUBLISHED' || exam.status === 'PUBLISHED' ? 'PUBLISHED' : data.status }
  return <>{assignments.length > 1 && <label className="mb-3 block text-sm font-semibold">{mode === 'reassign' ? 'Sao chép cấu hình từ' : 'Lần giao đề'}<select value={assignment?.id ?? ''} disabled={saveState.saving} onChange={(event) => setAssignmentId(event.target.value)} className="ml-3 rounded-lg border border-slate-200 p-2">{assignments.map((item, index) => <option key={item.id} value={item.id}>Lần {index + 1} · {item.assignmentType}</option>)}</select></label>}<ExamConfiguration key={assignment?.id ?? data.id} exam={configuration} onClose={onClose} saveState={saveState} mode={mode} /></>
}

function ConfigurationModal({ exam, open, onClose, onSaved, mode }) {
  const saveState = useSaveExamConfiguration(exam.id, onSaved, mode)
  return <Modal centered open={open} onCancel={() => { if (!saveState.saving) onClose() }} closable={!saveState.saving} keyboard={!saveState.saving} maskClosable={!saveState.saving} footer={null} width={1000} styles={{ body: { overflow: 'hidden' } }} title={mode === 'reassign' ? 'Giao lại / Mở đợt thi mới' : 'Chỉnh sửa cấu hình đề thi'} destroyOnHidden><LoadedConfiguration exam={exam} onClose={onClose} saveState={saveState} mode={mode} /></Modal>
}

export default function EditExamModal({ exam, open, onClose, onSaved, mode = 'edit' }) {
  return open && exam ? <ConfigurationModal key={`${mode}:${exam.id}`} exam={exam} open={open} onClose={onClose} onSaved={onSaved} mode={mode} /> : null
}
