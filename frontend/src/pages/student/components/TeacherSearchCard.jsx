import { Mail, Phone } from 'lucide-react'
import defaultAvatar from '../../../assets/images/avatar_default.png'

export default function TeacherSearchCard({ teacher, selected, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(teacher)} aria-pressed={selected}
      className={`relative w-full overflow-hidden rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md ${selected ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-200' : 'border-slate-200'}`}>
      <span className="relative flex flex-wrap items-center gap-4">
        <img src={teacher.avatar || defaultAvatar} alt={`Ảnh đại diện ${teacher.fullName || teacher.username}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultAvatar }} className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover" />
        <span className="min-w-0 flex-1">
          <span className="block break-words text-lg font-bold text-slate-900">{teacher.fullName || teacher.username || 'Giáo viên'}</span>
          {teacher.username && <span className="mt-1 block text-sm text-slate-500">@{teacher.username}</span>}
          <span className="mt-2 block text-sm text-slate-700">Mã giáo viên: {teacher.teacherCode || 'Chưa cập nhật'}</span>
          <span className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            {teacher.email && <span className="inline-flex items-center gap-2 break-all"><Mail size={15} className="shrink-0 text-slate-500" />{teacher.email}</span>}
            {teacher.phone && <span className="inline-flex items-center gap-2"><Phone size={15} className="text-slate-500" />{teacher.phone}</span>}
          </span>
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">Giáo viên</span>
      </span>
    </button>
  )
}
