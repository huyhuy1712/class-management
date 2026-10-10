import { sortByText } from '../../../../utils/sortByText'
import defaultAvatar from '../../../../assets/images/avatar_default.png'
import { formatDate } from '../../../../utils/dateUtils'
import AttendanceStatusBadge from '../../../teacher/classroom/tabs/attendance/AttendanceStatusBadge'

export default function StudentAttendanceTable({ records }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full min-w-[650px] text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Học sinh', 'Mã học sinh', 'Ngày', 'Trạng thái', 'Ghi chú'].map((label) => <th key={label} className="px-4 py-4 font-medium">{label}</th>)}</tr></thead>
      <tbody>{records.length ? sortByText(records, (item) => item.fullName).map((item) => <tr key={item.id} className="border-t border-slate-100">
        <td className="px-4 py-4"><div className="flex items-center gap-3"><img src={item.studentAvatar || defaultAvatar} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultAvatar }} className="h-10 w-10 rounded-xl object-cover" /><span className="font-semibold">{item.fullName}</span></div></td>
        <td className="px-4 py-4">{item.studentCode}</td>
        <td className="px-4 py-4">{formatDate(item.date)}<p className="mt-1 text-xs text-slate-400">{item.createdAt?.match(/T(\d{2}:\d{2})/)?.[1] ? `Điểm danh: ${item.createdAt.match(/T(\d{2}:\d{2})/)[1]}` : ''}</p></td>
        <td className="px-4 py-4"><AttendanceStatusBadge status={item.status} /></td>
        <td className="px-4 py-4">{item.note || '—'}</td>
      </tr>) : <tr><td colSpan={5} className="py-12 text-center text-slate-400">Không tìm thấy bản ghi điểm danh phù hợp.</td></tr>}</tbody>
    </table>
  </div>
}
