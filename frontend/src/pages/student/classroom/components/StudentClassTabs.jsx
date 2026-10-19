import { Bell, BookOpen, ClipboardCheck, FileText, Users } from 'lucide-react'
import StudentAttendanceTab from '../tabs/StudentAttendanceTab'
import StudentClassGradesTab from '../tabs/StudentClassGradesTab'
import ClassDocumentsTab from '../../../../components/classroom/detail/ClassDocumentsTab'
import useRoutePrefetch from '../../../../query/useRoutePrefetch'
import useResourceQuery from '../../../../query/useResourceQuery'
import StudentClassStudentsTab from '../tabs/StudentClassStudentsTab'
import useAuthStore from '../../../../stores/authStore'

const tabs = [
  { id: 'students', label: 'Học sinh', Icon: Users },
  { id: 'attendance', label: 'Điểm danh', Icon: ClipboardCheck },
  { id: 'grades', label: 'Điểm số', Icon: FileText },
  { id: 'materials', label: 'Tài liệu', Icon: BookOpen },
  { id: 'announcements', label: 'Bảng tin', Icon: Bell },
]

export default function StudentClassTabs({ selected, onSelect, classId }) {
  const prefetch = useRoutePrefetch()
  const examsQuery = useResourceQuery('studentExams', [])
  const studentsQuery = useResourceQuery('classStudents', [classId])
  const attendanceQuery = useResourceQuery('attendances', [classId])
  const userId = useAuthStore((state) => state.user?.id)
  const examCount = examsQuery.data?.items.filter((exam) => exam.classes?.some((item) => String(item.id) === String(classId))).length
  const counts = { students: studentsQuery.data?.length, grades: examCount,
    attendance: attendanceQuery.data?.filter((item) => userId != null && String(item.studentId) === String(userId)).length }
  const current = tabs.find((item) => item.id === selected)
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Nội dung lớp học" className="flex gap-2 overflow-x-auto rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm lg:flex-col">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} type="button" aria-current={selected === id ? 'page' : undefined} onMouseEnter={() => { if (id === 'grades') prefetch('/student/exams') }} onFocus={() => { if (id === 'grades') prefetch('/student/exams') }} onClick={() => onSelect(id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${selected === id ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Icon size={20} className="shrink-0" /><span className="flex-1 text-left">{label}</span>
            {counts[id] != null && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700 shadow-sm">{counts[id]}</span>}
          </button>
        ))}
      </nav>
      <section className="min-w-0 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        {selected === 'students' ? <StudentClassStudentsTab key={classId} classId={classId} /> : selected === 'attendance' ? <StudentAttendanceTab key={classId} classId={classId} /> : selected === 'grades' ? <StudentClassGradesTab key={classId} classId={classId} /> : selected === 'materials' ? <ClassDocumentsTab key={classId} classId={classId} /> : <>
        <h2 className="text-xl font-bold text-[#18301D]">{current.label}</h2>
        <p className="py-12 text-center text-sm text-slate-400">Nội dung sẽ được bổ sung sau.</p>
        </>}
      </section>
    </div>
  )
}
