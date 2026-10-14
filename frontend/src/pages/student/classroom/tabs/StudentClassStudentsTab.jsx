import { Users } from 'lucide-react'
import useResourceQuery from '../../../../query/useResourceQuery'
import useAuthStore from '../../../../stores/authStore'
import { sortByText } from '../../../../utils/sortByText'
import defaultAvatar from '../../../../assets/images/avatar_default.png'

export default function StudentClassStudentsTab({ classId }) {
  const query = useResourceQuery('classStudents', [classId])
  const userId = useAuthStore((state) => state.user?.id)
  const students = sortByText(query.data ?? [], (student) => student.fullName)
  return <div>
    <h2 className="flex items-center gap-3 text-xl font-bold text-[#18301D]"><Users size={23} className="text-emerald-600" />Học sinh {query.data ? `(${students.length})` : ''}</h2>
    {query.isError && query.data && <p role="alert" className="mt-4 text-sm text-amber-700">Chưa cập nhật được danh sách mới. <button type="button" onClick={() => query.refetch()} className="underline">Thử lại</button></p>}
    {query.isLoading ? <p role="status" className="py-10 text-center text-slate-500">Đang tải học sinh...</p>
      : query.errorMessage ? <p role="alert" className="py-8 text-red-600">{query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button></p>
        : students.length ? <ul className="mt-5 divide-y divide-slate-100">{students.map((student) => {
          const me = userId != null && String(student.id) === String(userId)
          return <li key={student.id} className="flex items-center gap-4 py-4">
            <img src={student.avatar || defaultAvatar} alt="" onError={(event) => { if (event.currentTarget.src !== new URL(defaultAvatar, window.location.href).href) event.currentTarget.src = defaultAvatar }} className="h-12 w-12 shrink-0 rounded-full border border-slate-100 object-cover" />
            <span className="min-w-0 break-words font-semibold text-[#18301D]">{student.fullName || 'Học sinh'}</span>
            {me && <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Bạn</span>}
          </li>
        })}</ul> : <p className="py-10 text-center text-slate-500">Lớp chưa có học sinh.</p>}
  </div>
}
