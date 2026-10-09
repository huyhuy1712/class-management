import { Modal } from 'antd'
import useSaveExamConfiguration from '../hooks/useSaveExamConfiguration'
import useExamResource from '../hooks/useExamResource'
import { getExamConfigurationForm } from '../helpers/examConfigurationForm'
import { focusConfigurationError } from '../helpers/examConfigurationErrors'
import { useEffect, useRef, useState } from 'react'
import subjectService from '../../../../services/subjectService'
import classroomService from '../../../../services/classroomService'
import userService from '../../../../services/userService'
import useCreateExamForm from '../create/hooks/useCreateExamForm'
import ExamBasicInfoSection from '../create/components/ExamBasicInfoSection'
import ExamSettingsSection from '../create/components/ExamSettingsSection'
import ExamResultSettingsSection from '../create/components/ExamResultSettingsSection'
import ExamAccessSection from '../create/components/ExamAccessSection'

function ExamConfiguration({ exam, onClose, saveState }) {
  const formRef = useRef(null)
  const published = exam.status === 'PUBLISHED'
  const locked = exam.status !== 'DRAFT' || exam.assignment?.status !== 'DRAFT'
  const { saving, save, error: saveError } = saveState
  const [options, setOptions] = useState({ subjects: [], classes: [], students: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([subjectService.getAll(), classroomService.getMyClasses(), userService.getMyStudents()])
      .then(([subjects, classes, students]) => {
        if (!active) return
        const activeClasses = classes.filter((item) => item.status === 'ACTIVE')
        const activeStudents = students.filter((item) => item.status === 'ACTIVE' && item.classes?.some((group) => activeClasses.some((classroom) => classroom.id === group.id)))
        setOptions({ subjects, classes: activeClasses.map((item) => ({ ...item, studentCount: activeStudents.filter((student) => student.classes?.some((group) => group.id === item.id)).length })), students: activeStudents })
      })
      .catch(() => { if (active) setError('Không thể tải môn học, lớp hoặc học sinh. Đóng và mở lại để thử lại.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const editor = useCreateExamForm({ ...options, initialConfig: getExamConfigurationForm(exam), persistDraft: false })
  return <form ref={formRef} className="flex min-h-0 flex-col overflow-hidden" style={{ height: 'min(720px, calc(100dvh - 160px))' }} onSubmit={(event) => { event.preventDefault(); if (!locked && !saving && !loading && !error && editor.validate()) save(editor.buildExamData(), exam, (errors) => { editor.setErrors(errors); focusConfigurationError(formRef.current, errors) }) }}>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2" style={{ scrollbarGutter: 'stable' }}>
    {published && <p role="note" className="mb-3 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">Bài thi đã xuất bản không thể chỉnh sửa.</p>}
    {saveError && <p role="alert" className="mb-4 text-red-600">{saveError}</p>}
    {locked && !published && <p className="mb-3 text-sm text-amber-700">Chỉ đề và lần giao ở trạng thái nháp mới được sửa cấu hình.</p>}
    {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
    <fieldset disabled={locked || saving} className="m-0 min-w-0 space-y-4 border-0 p-0 disabled:opacity-75">
      <ExamBasicInfoSection form={editor.form} errors={editor.errors} onChange={editor.handleChange} subjects={options.subjects} subjectsLoading={loading} subjectsError={error} />
      <ExamSettingsSection form={editor.form} errors={editor.errors} onChange={editor.handleChange} />
      <ExamResultSettingsSection form={editor.form} errors={editor.errors} onChange={editor.handleChange} />
      <ExamAccessSection form={editor.form} errors={editor.errors} onChange={editor.handleChange} error={editor.errors.accessType} accessType={editor.accessType} onAccessChange={editor.handleAccessChange} classes={editor.filteredClasses} selectedClasses={editor.selectedClasses} classSearch={editor.classSearch} onClassSearchChange={editor.setClassSearch} onToggleClass={editor.toggleClass} students={editor.studentsInSelectedClass} selectedStudentClassId={editor.selectedStudentClassId} selectedStudents={editor.selectedStudents} studentSearch={editor.studentSearch} onStudentSearchChange={editor.setStudentSearch} onToggleStudent={editor.toggleStudent} onStudentClassChange={editor.setSelectedStudentClassId} />
    </fieldset>
    </div>
    <div className="mt-4 flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white pt-4"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5">Hủy</button><button type="submit" disabled={locked || saving || loading || Boolean(error)} className="rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</button></div>
  </form>
}

function LoadedConfiguration({ exam, onClose, saveState }) {
  const { data, loading, error, retry } = useExamResource(exam.id, 'configuration')
  const [assignmentId, setAssignmentId] = useState('')
  if (loading) return <p role="status" className="p-6">Đang tải cấu hình đề thi...</p>
  if (error) return <div className="p-6"><p role="alert" className="text-red-600">{error}</p><button type="button" onClick={retry} className="mt-3 text-emerald-700">Thử lại</button></div>
  const assignments = data.assignments ?? []
  const assignment = assignments.find((item) => String(item.id) === assignmentId) ?? assignments[0]
  const configuration = { ...data, assignment, status: data.status === 'PUBLISHED' || exam.status === 'PUBLISHED' ? 'PUBLISHED' : data.status }
  return <>{assignments.length > 1 && <label className="mb-3 block text-sm font-semibold">Lần giao đề<select value={assignment?.id ?? ''} disabled={saveState.saving} onChange={(event) => setAssignmentId(event.target.value)} className="ml-3 rounded-lg border border-slate-200 p-2">{assignments.map((item, index) => <option key={item.id} value={item.id}>Lần {index + 1} · {item.assignmentType}</option>)}</select></label>}<ExamConfiguration key={assignment?.id ?? data.id} exam={configuration} onClose={onClose} saveState={saveState} /></>
}

function ConfigurationModal({ exam, open, onClose, onSaved }) {
  const saveState = useSaveExamConfiguration(exam.id, onSaved)
  return <Modal centered open={open} onCancel={() => { if (!saveState.saving) onClose() }} closable={!saveState.saving} keyboard={!saveState.saving} maskClosable={!saveState.saving} footer={null} width={1000} styles={{ body: { overflow: 'hidden' } }} title="Chỉnh sửa cấu hình đề thi" destroyOnHidden><LoadedConfiguration exam={exam} onClose={onClose} saveState={saveState} /></Modal>
}

export default function EditExamModal({ exam, open, onClose, onSaved }) {
  return open && exam ? <ConfigurationModal key={exam.id} exam={exam} open={open} onClose={onClose} onSaved={onSaved} /> : null
}
