import { useMemo, useState } from 'react'
import FrogLoading from '../../../../utils/FrogLoading'
import {
  BookOpen,
  Check,
  UserRound,
  Users,
} from 'lucide-react'
import AccessOption from '../../exams/create/components/ui/AccessOption'
import ClassSelector from '../../exams/create/components/ClassSelector'
import StudentSelector from '../../exams/create/components/StudentSelector'

export default function HomeworkAssignmentScope({
  form,
  setForm,
  classes,
  students,
  classesLoading,
  classesError,
  studentsLoading,
  studentsError,
  onToggleClass,
  onToggleStudent,
}) {
  const [classSearch, setClassSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const filteredClasses = useMemo(() => {
    const search = classSearch.trim().toLocaleLowerCase()
    if (!search) return classes
    return classes.filter((classroom) =>
      `${classroom.name ?? ''} ${classroom.code ?? ''}`.toLocaleLowerCase().includes(search),
    )
  }, [classes, classSearch])
  const studentsInSelectedClass = useMemo(() => {
    const search = studentSearch.trim().toLocaleLowerCase()
    return students.filter((student) => {
      const belongsToClass = student.classes?.some(
        (classroom) => String(classroom.id) === String(form.classId),
      )
      const matchesSearch = `${student.fullName ?? ''} ${student.studentCode ?? ''}`
        .toLocaleLowerCase()
        .includes(search)
      return belongsToClass && matchesSearch
    })
  }, [form.classId, studentSearch, students])

  const changeAssignmentType = (assignmentType) => {
    setForm((current) => ({
      ...current,
      assignmentType,
      classIds: [],
      studentIds: [],
      classId: '',
    }))
    setClassSearch('')
    setStudentSearch('')
  }

  const changeStudentClass = (classId) => {
    setForm((current) => ({ ...current, classId: classId ?? '' }))
    setStudentSearch('')
  }

  return (
    <section className="lg:col-span-2" aria-labelledby="homework-assignment-scope-title">
      <h2 id="homework-assignment-scope-title" className="font-bold text-[#18301D]">
        Ai được giao bài?
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Chọn phạm vi học sinh nhận bài tập.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <AccessOption
          selected={form.assignmentType === 'ALL'}
          icon={Users}
          title="Tất cả học sinh"
          description="Toàn bộ lớp của bạn"
          onClick={() => changeAssignmentType('ALL')}
        />
        <AccessOption
          selected={form.assignmentType === 'CLASS'}
          icon={BookOpen}
          title="Giao theo lớp"
          description="Chọn một hoặc nhiều lớp"
          onClick={() => changeAssignmentType('CLASS')}
        />
        <AccessOption
          selected={form.assignmentType === 'STUDENT'}
          icon={UserRound}
          title="Giao theo học sinh"
          description="Chọn học sinh cụ thể"
          onClick={() => changeAssignmentType('STUDENT')}
        />
      </div>

      {form.assignmentType === 'ALL' && (
        classesLoading || classesError || classes.length === 0 ? (
          <div
            role={classesError ? 'alert' : 'status'}
            className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
          >
            {classesLoading
              ? <FrogLoading label="Đang tải danh sách lớp..." />
              : classesError || 'Chưa có lớp đang hoạt động.'}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-green-100 bg-green-50/60 p-4">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Tất cả học sinh được giao bài
                </p>
                <p className="mt-1 text-sm leading-6 text-green-700">
                  Bài tập sẽ được giao cho học sinh thuộc {classes.length} lớp đang hoạt động của bạn.
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {form.assignmentType === 'CLASS' && (
        classesLoading ? (
          <div role="status" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <FrogLoading label="Đang tải danh sách lớp..." />
          </div>
        ) : classesError ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {classesError}
          </div>
        ) : (
          <ClassSelector
            classes={filteredClasses}
            selectedClasses={form.classIds}
            search={classSearch}
            onSearchChange={setClassSearch}
            onToggle={onToggleClass}
          />
        )
      )}

      {form.assignmentType === 'STUDENT' && (
        classesLoading ? (
          <div role="status" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <FrogLoading label="Đang tải danh sách lớp..." />
          </div>
        ) : classesError ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {classesError}
          </div>
        ) : studentsError ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {studentsError}
          </div>
        ) : studentsLoading ? (
          <div role="status" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <FrogLoading label="Đang tải danh sách học sinh..." />
          </div>
        ) : (
          <StudentSelector
            students={studentsInSelectedClass}
            classes={classes}
            selectedClassId={form.classId}
            selectedStudents={form.studentIds}
            onClassChange={changeStudentClass}
            search={studentSearch}
            onSearchChange={setStudentSearch}
            onToggle={onToggleStudent}
          />
        )
      )}
    </section>
  )
}
