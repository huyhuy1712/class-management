import FrogLoading from '../../../../utils/FrogLoading'

export default function AdminUserActionModal({
  action,
  impersonationReason,
  deletePending,
  impersonationPending,
  onClose,
  onReasonChange,
  onConfirm,
}) {
  if (!action) return null
  const isDelete = action.type === 'delete'
  const isPending = deletePending || impersonationPending

  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="admin-modal admin-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-action-confirm-title"
      >
        <div className="admin-modal__header">
          <div>
            <span className="admin-eyebrow">{isDelete ? 'DELETE ACCOUNT' : 'ACCOUNT ACCESS'}</span>
            <h2 id="user-action-confirm-title">
              {isDelete ? 'Xác nhận xóa tài khoản' : 'Xác nhận đăng nhập'}
            </h2>
            <p>
              {isDelete
                ? `Bạn có chắc chắn muốn xóa tài khoản "${action.user.name}" không? Thao tác này không thể hoàn tác.`
                : `Bạn sẽ chuyển sang sử dụng hệ thống với tư cách "${action.user.name}".`}
            </p>
          </div>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Đóng xác nhận" disabled={isPending}>
            ×
          </button>
        </div>

        {action.type === 'impersonate' && (
          <div className="admin-modal__body">
            <div className="admin-form-field">
              <label htmlFor="impersonation-reason">Lý do truy cập (không bắt buộc)</label>
              <textarea
                id="impersonation-reason"
                value={impersonationReason}
                onChange={(event) => onReasonChange(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Nhập lý do để lưu lại trong hệ thống"
              />
            </div>
          </div>
        )}

        <div className="admin-modal__footer">
          <button type="button" className="admin-secondary-btn" onClick={onClose} disabled={isPending}>
            Hủy
          </button>
          <button type="button" className={isDelete ? 'admin-danger-btn' : 'admin-primary-btn'} onClick={onConfirm} disabled={isPending}>
            {isPending
              ? <FrogLoading compact label="Đang xử lý..." />
              : isDelete
                ? 'Xóa tài khoản'
                : 'Tiếp tục'}
          </button>
        </div>
      </section>
    </div>
  )
}
