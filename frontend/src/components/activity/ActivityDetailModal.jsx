import { useEffect } from 'react'
import { ArrowUpRight, Clock3, ExternalLink, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const resourceLabels = {
  ACCOUNT: 'Tài khoản',
  SUBJECT: 'Môn học',
  IMPERSONATION: 'Mạo danh',
  CLASSROOM: 'Lớp học',
  EXAM: 'Đề thi / bài kiểm tra',
  HOMEWORK: 'Bài tập',
  GRADE: 'Điểm số',
  MATERIAL: 'Tài liệu',
  ATTENDANCE: 'Điểm danh',
  LESSON: 'Buổi học',
  CLASS_FEED: 'Bảng tin lớp',
  STUDENT: 'Học sinh',
  VIP: 'Gói VIP',
  POINTS: 'Point',
  MISSION: 'Nhiệm vụ',
}

const actionLabels = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  PURCHASE: 'Mua',
  REDEEM: 'Đổi Point',
  CLAIM: 'Nhận thưởng',
  PUBLISH: 'Xuất bản',
  UNPUBLISH: 'Thu hồi xuất bản',
  START: 'Bắt đầu',
  SUBMIT: 'Nộp bài',
  GRADE: 'Chấm điểm',
  REOPEN: 'Mở lại',
  RESET: 'Đặt lại',
  APPROVE: 'Duyệt',
  REJECT: 'Từ chối',
  BLOCK: 'Khóa tài khoản',
  UNBLOCK: 'Mở khóa tài khoản',
  GRANT_VIP: 'Cấp VIP',
  REMOVE_VIP: 'Gỡ VIP',
  IMPERSONATION_START: 'Bắt đầu mạo danh',
  IMPERSONATION_END: 'Kết thúc mạo danh',
  REQUEST_JOIN: 'Gửi yêu cầu tham gia',
  COMMENT: 'Bình luận',
  MARK_ATTENDANCE: 'Điểm danh',
  ADD: 'Thêm',
  REMOVE: 'Gỡ',
  ARCHIVE: 'Lưu trữ',
  ACTIVATE: 'Kích hoạt',
  IMPORT: 'Nhập dữ liệu',
  CANCEL: 'Hủy',
  INTERACT: 'Tương tác',
  UPDATE_DEADLINE: 'Gia hạn hạn nộp',
}

function formatActivityTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Thời gian không xác định'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date)
}

export default function ActivityDetailModal({ item, viewerRole, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!item) return null

  const actorRole = viewerRole === 'ADMIN' ? item.actorRole : viewerRole
  const isListTarget = item.targetPath && !/\/\d+(?:\/|$)/.test(item.targetPath)
  const targetLabel = isListTarget || item.action === 'DELETE'
    ? 'Mở danh sách liên quan'
    : 'Đi tới đối tượng'
  const navigationState = actorRole === 'STUDENT' && item.classId && (
    item.resourceType === 'CLASS_FEED' ? { tab: 'announcements' }
      : item.resourceType === 'ATTENDANCE' ? { tab: 'attendance' }
        : item.resourceType === 'GRADE' ? { tab: 'grades' }
        : undefined
  )

  const openTarget = () => {
    if (!item.targetPath) return
    onClose()
    navigate(item.targetPath, navigationState ? { state: navigationState } : undefined)
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-detail-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Clock3 size={21} />
            </span>
            <div className="min-w-0">
              <h2 id="activity-detail-title" className="text-lg font-bold text-slate-900">
                Chi tiết hoạt động
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {resourceLabels[item.resourceType] ?? item.resourceType ?? 'Hoạt động'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết hoạt động"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Nội dung</p>
            <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-900">
              {item.summary || 'Không có mô tả chi tiết cho hoạt động này.'}
            </p>
          </div>

          <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">Loại hoạt động</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {resourceLabels[item.resourceType] ?? item.resourceType ?? 'Không xác định'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Thao tác</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {actionLabels[item.action] ?? item.action ?? 'Không xác định'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Thời gian</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {formatActivityTime(item.occurredAt)}
              </dd>
            </div>
            {viewerRole === 'ADMIN' ? (
              <div>
                <dt className="text-xs font-medium text-slate-500">Người thực hiện</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {item.actorName || 'Tài khoản không còn tồn tại'}
                  {item.actorUsername ? ` (@${item.actorUsername})` : ''}
                  {item.actorRole ? ` · ${item.actorRole === 'TEACHER' ? 'Giáo viên' : item.actorRole === 'STUDENT' ? 'Học sinh' : item.actorRole}` : ''}
                </dd>
              </div>
            ) : (
              <div>
                <dt className="text-xs font-medium text-slate-500">Người thực hiện</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">Bạn</dd>
              </div>
            )}
            {item.classId && (
              <div>
                <dt className="text-xs font-medium text-slate-500">Mã lớp</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">#{item.classId}</dd>
              </div>
            )}
            {item.resourceId && (
              <div>
                <dt className="text-xs font-medium text-slate-500">Mã tham chiếu</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">#{item.resourceId}</dd>
              </div>
            )}
          </dl>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Đóng
          </button>
          {viewerRole !== 'ADMIN' && (item.targetPath ? (
            <button
              type="button"
              onClick={openTarget}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              {isListTarget ? <ArrowUpRight size={16} /> : <ExternalLink size={16} />}
              {targetLabel}
            </button>
          ) : (
            <p className="self-center text-sm text-slate-500">
              Không có trang đích cho hoạt động này.
            </p>
          )
          )}
        </footer>
      </section>
    </div>
  )
}
