import { useMemo } from 'react'
import { BookOpen, Check, UserRound, Users } from 'lucide-react'
import AccessOption from '../../exams/create/components/ui/AccessOption'
import ClassSelector from '../../exams/create/components/ClassSelector'
import StudentSelector from '../../exams/create/components/StudentSelector'

const options = [
  { value: 'ALL', title: 'Tất cả học sinh', description: 'Toàn bộ lớp của bạn', icon: Users },
  { value: 'CLASS', title: 'Giao theo lớp', description: 'Chọn một hoặc nhiều lớp', icon: BookOpen },
  { value: 'STUDENT', title: 'Giao theo học sinh', description: 'Chọn từng học sinh cụ thể', icon: UserRound },
]

export default function MaterialAssignmentFields({
  targetType,
  onTargetTypeChange,
  targetError = '',
  retryTargets,
  classes,
  students,
  classIds,
  studentIds,
  onToggleClass,
  onToggleStudent,
  selectedStudentClassId,
  onStudentClassChange,
  classSearch,
  onClassSearchChange,
  studentSearch,
  onStudentSearchChange,
}) {
  const filteredClasses = useMemo(() => {
    const keyword = classSearch.trim().toLocaleLowerCase()
    if (!keyword) return classes
    return classes.filter((classroom) =>
      `${classroom.name ?? ''} ${classroom.code ?? ''}`.toLocaleLowerCase().includes(keyword),
    )
  }, [classes, classSearch])

  const studentsInSelectedClass = useMemo(() => {
    const keyword = studentSearch.trim().toLocaleLowerCase()
    return students.filter((student) => {
      const belongsToClass = student.classes?.some(
        (classroom) => String(classroom.id) === String(selectedStudentClassId),
      )
      if (!belongsToClass) return false
      return !keyword || `${student.fullName ?? ''} ${student.studentCode ?? ''} ${student.phone ?? ''}`
        .toLocaleLowerCase()
        .includes(keyword)
    })
  }, [selectedStudentClassId, studentSearch, students])

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-slate-800">Phân phối tài liệu</legend>

      {targetError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {targetError}
          <button type="button" onClick={retryTargets} className="ml-2 font-semibold underline">Thử tải lại</button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {options.map(({ value, title, description, icon }) => (
          <AccessOption
            key={value}
            selected={targetType === value}
            icon={icon}
            title={title}
            description={description}
            onClick={() => onTargetTypeChange(value)}
          />
        ))}
      </div>

      {targetType === 'ALL' && (
        <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Tất cả học sinh được nhận tài liệu</p>
              <p className="mt-1 text-sm leading-6 text-green-700">
                Tài liệu sẽ được phân phối cho toàn bộ học sinh thuộc các lớp bạn đang phụ trách.
              </p>
            </div>
          </div>
        </div>
      )}

      {targetType === 'CLASS' && (
        <>
          <ClassSelector
            classes={filteredClasses}
            selectedClasses={classIds}
            search={classSearch}
            onSearchChange={onClassSearchChange}
            onToggle={onToggleClass}
          />
          {!filteredClasses.length && (
            <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {classes.length ? 'Không tìm thấy lớp phù hợp.' : 'Chưa có lớp học đang hoạt động để phân phối tài liệu.'}
            </p>
          )}
        </>
      )}

      {targetType === 'STUDENT' && (
        classes.length ? (
          <StudentSelector
            students={studentsInSelectedClass}
            classes={classes}
            selectedClassId={selectedStudentClassId}
            selectedStudents={studentIds}
            onClassChange={onStudentClassChange}
            search={studentSearch}
            onSearchChange={onStudentSearchChange}
            onToggle={onToggleStudent}
          />
        ) : (
          <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Chưa có lớp học đang hoạt động để chọn học sinh.
          </p>
        )
      )}
    </fieldset>
  )
}
