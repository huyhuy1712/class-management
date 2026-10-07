import {
  ArrowLeft,
  Check,
  FileText,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import subjectService from '../../../../services/subjectService'
import classroomService from '../../../../services/classroomService'
import userService from '../../../../services/userService'

import ExamAccessSection from './components/ExamAccessSection'
import ExamBasicInfoSection from './components/ExamBasicInfoSection'
import CreateMethodSection from './components/CreateMethodSection'
import ExamSettingsSection from './components/ExamSettingsSection'


import useCreateExamForm from './hooks/useCreateExamForm'

function CreateExamPage() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [subjectsError, setSubjectsError] = useState('')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])

  useEffect(() => {
    let cancelled = false

    const loadSubjects = async () => {
      try {
        setSubjectsLoading(true)
        setSubjectsError('')
        const data = await subjectService.getAll()

        if (!cancelled) {
          setSubjects(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Get subjects for create exam error:', error)
        if (!cancelled) {
          setSubjects([])
          setSubjectsError('Không thể tải danh sách môn học.')
        }
      } finally {
        if (!cancelled) setSubjectsLoading(false)
      }
    }

    loadSubjects()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      classroomService.getMyClasses(),
      userService.getMyStudents(),
    ])
      .then(([classData, studentData]) => {
        if (!cancelled) {
          setClasses(Array.isArray(classData) ? classData : [])
          setStudents(Array.isArray(studentData) ? studentData : [])
        }
      })
      .catch((error) => {
        console.error('Get exam access data error:', error)
        if (!cancelled) {
          setClasses([])
          setStudents([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const {
    form,
    accessType,

    selectedClasses,
    selectedStudents,
    selectedStudentClassId,

    classSearch,
    studentSearch,

    filteredClasses,
    filteredStudents,
    studentsInSelectedClass,

    handleChange,
    handleAccessChange,

    toggleClass,
    toggleStudent,
    setSelectedStudentClassId,

    setClassSearch,
    setStudentSearch,

    buildExamData,
  } = useCreateExamForm({
    classes,
    students,
  })

  const handleCreateOnline = () => {
    const data = buildExamData()

    console.log(
      'CREATE ONLINE:',
      data,
    )
  }

  const handleImportFile = () => {
    const data = buildExamData()

    console.log(
      'IMPORT FILE:',
      data,
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_32%),#F4F6F8]">
        <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">

        {/* PAGE HEADER */}
        <div className="relative mb-7 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-[#ecfdf5] via-white to-[#f0fdf4] px-5 py-6 shadow-[0_12px_35px_rgba(16,185,129,0.08)] sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-200/30 blur-2xl" />
          <div className="relative">
          {/* BACK */}
          <button
            type="button"
            onClick={() => navigate('/teacher/exams')}
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
            ['02', 'Thiết lập bài thi', 'Thời gian và thang điểm'],
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
            onChange={handleChange}
            subjects={subjects}
            subjectsLoading={subjectsLoading}
            subjectsError={subjectsError}
          />

          {/* THIẾT LẬP BÀI THI */}
          <ExamSettingsSection
            form={form}
            onChange={handleChange}
          />

          {/* AI ĐƯỢC PHÉP LÀM */}
          <ExamAccessSection
            accessType={accessType}
            onAccessChange={handleAccessChange}

            classes={filteredClasses}
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