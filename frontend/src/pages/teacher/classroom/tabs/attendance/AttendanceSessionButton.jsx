import { Clock3 } from 'lucide-react'
import CreateAttendanceSessionModal from './modals/CreateAttendanceSessionModal'
import useAttendanceSession from './useAttendanceSession'

export default function AttendanceSessionButton({ classroomId }) {
  const { createAttendanceOpen, creatingAttendance, loadingAttendanceSession, createAttendanceError, existingAttendanceSession, attendanceSessionLookupFailed, handleOpenAttendanceSession, handleCreateAttendanceSession, toast, close } = useAttendanceSession(classroomId)
  return <>
                <button
                  type="button"
                  onClick={handleOpenAttendanceSession}
                  className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                >
                  <Clock3 size={18} />
                  Tạo điểm danh
                </button>
    {toast && <div role="status" className="fixed right-4 top-4 z-[70] rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-lg">{toast.message}</div>}
<CreateAttendanceSessionModal
  open={createAttendanceOpen}
  loading={creatingAttendance}
  loadingSession={loadingAttendanceSession}
  existingSession={existingAttendanceSession}
  sessionLookupFailed={attendanceSessionLookupFailed}
  error={createAttendanceError}
  onClose={close}
  onSubmit={handleCreateAttendanceSession}
/>
  </>
}
