import useSubmitAttendance from '../hooks/useSubmitAttendance'
import LateAttendanceModal from '../../modals/LateAttendanceModal'
import { CheckCircle2, Clock3, UserX, ClipboardCheck } from 'lucide-react'
import useStudentAttendance from '../hooks/useStudentAttendance'
import useAttendanceAvailability from '../../hooks/useAttendanceAvailability'
import AttendancePasswordModal from '../../modals/AttendancePasswordModal'
import StudentAttendanceTable from '../components/StudentAttendanceTable'
import { formatDate } from '../../../../utils/dateUtils'

export default function StudentAttendanceTab({ classId }) {
  const data = useStudentAttendance(classId)
  const availability = useAttendanceAvailability([classId])
  const submission = useSubmitAttendance(classId, data.addRecords)
  const stats = [
    { key: 'PRESENT', label: 'Có mặt', Icon: CheckCircle2, style: 'bg-emerald-50 text-emerald-700' },
    { key: 'ABSENT', label: 'Vắng', Icon: UserX, style: 'bg-rose-50 text-red-600' },
    { key: 'LATE', label: 'Đi trễ', Icon: Clock3, style: 'bg-amber-50 text-amber-700' },
  ]
  return <>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-xl font-bold text-[#18301D]">Điểm danh</h2><p className="mt-1 text-sm text-slate-500">Theo dõi lịch sử điểm danh của bạn trong lớp học</p></div>
      <button type="button" disabled={!availability.available || submission.busy} title={availability.reason} onClick={submission.open} className="flex items-center gap-2 rounded-xl bg-[#00B33C] px-4 py-3 font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><ClipboardCheck size={18} />Điểm danh</button>
    </div>
    {!availability.available && <p role="status" className="mt-3 text-sm text-slate-500">{availability.reason}</p>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <input type="date" aria-label="Ngày điểm danh" value={data.date} onChange={(event) => data.setDate(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" />
      <select aria-label="Trạng thái điểm danh" value={data.status} onChange={(event) => data.setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3"><option value="ALL">Tất cả trạng thái</option>{stats.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
    </div>
    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500"><span>{data.date ? `Đang xem ngày: ${formatDate(data.date)}` : 'Đang xem tất cả ngày'}</span>{data.date && <button type="button" onClick={() => data.setDate('')} className="text-emerald-700">× Xem tất cả ngày</button>}</div>
    <div className="my-6 grid gap-3 sm:grid-cols-3">{stats.map(({ key, label, Icon, style }) => <div key={key} className={`flex items-center justify-between rounded-xl p-4 ${style}`}><span className="flex items-center gap-2"><Icon size={19} />{label}</span><strong>{data.loading || data.error ? '—' : data.counts[key]}</strong></div>)}</div>
    {data.loading ? <p className="text-sm text-slate-500">Đang tải điểm danh...</p> : data.error ? <p role="alert" className="text-red-600">{data.error}</p> : <><p className="mb-3 text-sm text-slate-500">{data.filtered.length} bản ghi điểm danh</p><StudentAttendanceTable records={data.filtered} /></>}
    {submission.success && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 font-semibold text-green-700">{submission.success}</p>}
    {submission.step === 'password' && <AttendancePasswordModal onClose={submission.close} onSubmit={submission.submitPassword} busy={submission.busy} error={submission.error} />}
    {submission.step === 'late' && <LateAttendanceModal onClose={submission.close} onSubmit={submission.submitReason} busy={submission.busy} error={submission.error} />}
  </>
}
