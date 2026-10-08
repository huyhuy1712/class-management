import {
  BookOpen,
  Check,
  UserRound,
  Users,
} from 'lucide-react'

import { EXAM_ACCESS_TYPE } from '../helpers/examFormConstants'
import AccessOption from './ui/AccessOption'
import ClassSelector from './ClassSelector'
import StudentSelector from './StudentSelector'

function ExamAccessSection({
  error,
  accessType,
  onAccessChange,

  classes,
  selectedClasses,
  classSearch,
  onClassSearchChange,
  onToggleClass,

  students,
  selectedStudentClassId,
  selectedStudents,
  studentSearch,
  onStudentSearchChange,
  onToggleStudent,
  onStudentClassChange,
}) {
  return (
<section id="exam-access" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">      <h2 className="font-bold text-[#18301D]">
        Ai được phép làm?
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Chọn phạm vi học sinh có thể tham gia
        đề thi.
      </p>

      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-500">{error}</p>}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <AccessOption
          selected={
            accessType ===
            EXAM_ACCESS_TYPE.ALL
          }
          icon={Users}
          title="Tất cả học sinh"
          description="Toàn bộ lớp của bạn"
          onClick={() =>
            onAccessChange(
              EXAM_ACCESS_TYPE.ALL,
            )
          }
        />

        <AccessOption
          selected={
            accessType ===
            EXAM_ACCESS_TYPE.CLASS
          }
          icon={BookOpen}
          title="Giao theo lớp"
          description="Chọn một hoặc nhiều lớp"
          onClick={() =>
            onAccessChange(
              EXAM_ACCESS_TYPE.CLASS,
            )
          }
        />

        <AccessOption
          selected={
            accessType ===
            EXAM_ACCESS_TYPE.STUDENT
          }
          icon={UserRound}
          title="Giao theo học sinh"
          description="Chọn từng học sinh cụ thể"
          onClick={() =>
            onAccessChange(
              EXAM_ACCESS_TYPE.STUDENT,
            )
          }
        />
      </div>

      {accessType === EXAM_ACCESS_TYPE.ALL && (
        <div className="mt-5 rounded-xl border border-green-100 bg-green-50/60 p-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check size={17} />
            </div>

            <div>
              <p className="text-sm font-semibold text-green-800">
                Tất cả học sinh được phép làm
              </p>

              <p className="mt-1 text-sm leading-6 text-green-700">
                Đề thi sẽ được áp dụng cho toàn
                bộ học sinh thuộc các lớp mà bạn
                đang phụ trách.
              </p>
            </div>
          </div>
        </div>
      )}

      {accessType ===
        EXAM_ACCESS_TYPE.CLASS && (
        <ClassSelector
          classes={classes}
          selectedClasses={selectedClasses}
          search={classSearch}
          onSearchChange={
            onClassSearchChange
          }
          onToggle={onToggleClass}
        />
      )}

      {accessType ===
        EXAM_ACCESS_TYPE.STUDENT && (
        <StudentSelector
          students={students}
          classes={classes}
          selectedClassId={selectedStudentClassId}
          selectedStudents={
            selectedStudents
          }
          onClassChange={onStudentClassChange}
          search={studentSearch}
          onSearchChange={
            onStudentSearchChange
          }
          onToggle={onToggleStudent}
        />
      )}
    </section>
  )
}

export default ExamAccessSection
