import { Bell, ClipboardCheck, FileText } from 'lucide-react'
import StudentAttendanceTab from '../tabs/StudentAttendanceTab'

const tabs = [
  { id: 'attendance', label: 'Điểm danh', Icon: ClipboardCheck },
  { id: 'exams', label: 'Đề thi', Icon: FileText },
  { id: 'announcements', label: 'Bảng tin', Icon: Bell },
]

export default function StudentClassTabs({ selected, onSelect, classId }) {
  const current = tabs.find((item) => item.id === selected)
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Nội dung lớp học" className="flex gap-2 overflow-x-auto rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm lg:flex-col">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} type="button" aria-current={selected === id ? 'page' : undefined} onClick={() => onSelect(id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${selected === id ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Icon size={20} />{label}
          </button>
        ))}
      </nav>
      <section className="min-w-0 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        {selected === 'attendance' ? <StudentAttendanceTab key={classId} classId={classId} /> : <>
        <h2 className="text-xl font-bold text-[#18301D]">{current.label}</h2>
        <p className="py-12 text-center text-sm text-slate-400">Nội dung sẽ được bổ sung sau.</p>
        </>}
      </section>
    </div>
  )
}
