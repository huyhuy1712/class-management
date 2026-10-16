import useExamTargetOptions from '../hooks/useExamTargetOptions'
import { message } from 'antd'
import { useState } from 'react'
import PdfImportModal from './components/PdfImportModal'
import {
  ArrowLeft,
  Check,
  FileText,
  Sparkles,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadExamDraft } from '../draft/examDraftStorage'

import DashboardLayout from '../../../../layouts/DashboardLayout'

import ExamAccessSection from './components/ExamAccessSection'
import ExamBasicInfoSection from './components/ExamBasicInfoSection'
import CreateMethodSection from './components/CreateMethodSection'
import ExamSettingsSection from './components/ExamSettingsSection'
import ExamResultSettingsSection from './components/ExamResultSettingsSection'


import useCreateExamForm from './hooks/useCreateExamForm'

function CreateExamPage() {
  const [importConfig, setImportConfig] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [messageApi, messageContext] = message.useMessage()
  const navigate = useNavigate()
  const { state } = useLocation()
  const defaultClassId = Number(state?.defaultClassId)
  const { subjects, subjectsLoading, subjectsError, retrySubjects, classes, classesLoading, classesError, students, loading: targetsLoading, error: targetsError } = useExamTargetOptions()
  const {
    form,
    errors,
    accessType,

    selectedClasses,
    selectedStudents,
    selectedStudentClassId,

    classSearch,
    studentSearch,

    filteredClasses,
    studentsInSelectedClass,

    handleChange,
    handleAccessChange,

    toggleClass,
    toggleStudent,
    setSelectedStudentClassId,

    setClassSearch,
    setStudentSearch,

    validate,
    buildExamData,
  } = useCreateExamForm({
    classes,
    students,
    initialConfig: Number.isSafeInteger(defaultClassId) && defaultClassId > 0
      ? { ...loadExamDraft()?.general?.form, accessType: 'CLASS', classIds: [defaultClassId], studentIds: [], classId: null }
      : undefined,
  })

  // Both creation methods must pass the same configuration checks.
  const validatedConfiguration = () => {
    const valid = validate()
    if (subjectsLoading || targetsLoading) {
      messageApi.warning('Đang tải môn học và đối tượng giao đề. Vui lòng thử lại sau.')
      return null
    }
    if (subjectsError || targetsError) {
      messageApi.error('Chưa tải được môn học hoặc đối tượng giao đề. Vui lòng thử lại trước khi tiếp tục.')
      return null
    }
    if (!valid) {
      messageApi.warning('Vui lòng hoàn tất cấu hình đề thi tại các trường được đánh dấu.')
      return null
    }
    if (!subjects.some((subject) => String(subject.id) === String(form.subjectId))) {
      messageApi.warning('Môn học đã chọn không còn khả dụng. Vui lòng chọn lại môn học.')
      return null
    }
    return buildExamData()
  }

  const handleCreateOnline = () => {
    const data = validatedConfiguration()
    if (!data) return

    navigate('/teacher/exams/create/online', {
      state: { examConfig: data },
    })
  }

  const handleImportFile = () => {
    const config = validatedConfiguration()
    if (!config) return
    setImportConfig(config)
    setImportOpen(true)
  }

  return (
    <DashboardLayout>
      {messageContext}
      {importConfig && <PdfImportModal open={importOpen} onClose={() => setImportOpen(false)} config={importConfig} />}
      <div className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_32%),#F4F6F8]">
        <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">

        {/* PAGE HEADER */}
        <div className="relative mb-7 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-[#ecfdf5] via-white to-[#f0fdf4] px-5 py-6 shadow-[0_12px_35px_rgba(16,185,129,0.08)] sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-200/30 blur-2xl" />
          <div className="relative">
          {/* BACK */}
          <button
            type="button"
            onClick={() => navigate(Number.isSafeInteger(defaultClassId) && defaultClassId > 0 ? `/teacher/classes/${defaultClassId}/assignments` : '/teacher/exams')}
            className="mb-3 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft size={17} />
            Quay lại danh sách đề thi
          </button>

          {/* TITLE */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                <Sparkles size={15} />
                Thiết lập bài thi
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[34px]">
                Tạo đề thi
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Thiết lập thông tin, cấu hình bài thi và đối tượng được phép tham gia.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-700 shadow-sm">
              <FileText size={16} />
              <span>Đề thi mới</span>
            </div>
          </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['01', 'Thông tin chung', 'Tên, môn học và mục đích'],
            ['02', 'Thiết lập bài thi', 'Thời gian và số lần làm'],
            ['03', 'Đối tượng làm bài', 'Lớp hoặc học sinh cụ thể'],
          ].map(([number, title, description]) => (
            <div
              key={number}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-extrabold text-emerald-600">
                {number}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{title}</p>
                <p className="truncate text-xs text-slate-400">{description}</p>
              </div>
              <Check size={16} className="ml-auto shrink-0 text-slate-300" />
            </div>
          ))}
        </div>

        <div className="space-y-5">

          {/* THÔNG TIN CƠ BẢN */}
          <ExamBasicInfoSection
            form={form}
            errors={errors}
            onChange={handleChange}
            subjects={subjects}
            subjectsLoading={subjectsLoading}
            subjectsError={subjectsError}
            onRetrySubjects={retrySubjects}
          />

          {/* THIẾT LẬP BÀI THI */}
          <ExamSettingsSection
            form={form}
            errors={errors}
            onChange={handleChange}
          />

          {/* ĐIỂM VÀ ĐÁP ÁN */}
          <ExamResultSettingsSection
            form={form}
            errors={errors}
            onChange={handleChange}
          />

          {/* AI ĐƯỢC PHÉP LÀM */}
          {targetsError && <p role="alert" className="text-sm text-red-600">{targetsError}</p>}
          <ExamAccessSection
            form={form} errors={errors} onChange={handleChange}
            error={errors.accessType}
            accessType={accessType}
            onAccessChange={handleAccessChange}

            classes={filteredClasses}
            classCount={classes.length}
            classesLoading={classesLoading}
            classesError={classesError}
            selectedClasses={selectedClasses}
            classSearch={classSearch}
            onClassSearchChange={setClassSearch}
            onToggleClass={toggleClass}

            students={studentsInSelectedClass}
            selectedStudentClassId={selectedStudentClassId}
            selectedStudents={selectedStudents}
            onStudentClassChange={setSelectedStudentClassId}
            studentSearch={studentSearch}
            onStudentSearchChange={setStudentSearch}
            onToggleStudent={toggleStudent}
          />

          {/* CÁCH TẠO ĐỀ */}
          <CreateMethodSection
            disabled={subjectsLoading || targetsLoading || Boolean(subjectsError || targetsError)}
            onCreateOnline={handleCreateOnline}
            onImportFile={handleImportFile}
          />

        </div>
      </div>
      </div>
    </DashboardLayout>
  )

}

export default CreateExamPage
