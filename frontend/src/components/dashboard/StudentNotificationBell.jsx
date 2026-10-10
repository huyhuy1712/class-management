import { useState } from 'react'
import { Bell } from 'lucide-react'
import useStudentNotifications from './hooks/useStudentNotifications'
import StudentNotificationsModal from './modals/StudentNotificationsModal'

export default function StudentNotificationBell() {
  const [open, setOpen] = useState(false)
  const data = useStudentNotifications()
  return <>
    <button type="button" aria-label={data.unread ? 'Thông báo: có thông báo chưa đọc' : 'Thông báo'} onClick={() => setOpen(true)} className="relative rounded-xl border border-green-100 p-3 text-slate-600 hover:bg-green-50">
      <Bell size={21} />
      {data.unread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
    </button>
    {open && <StudentNotificationsModal {...data} onClose={() => setOpen(false)} />}
  </>
}
