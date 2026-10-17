export default function AdminSubjectDeleteModal({ subject, isPending, onClose, onConfirm }) {
  if (!subject) return null

  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose()
      }}
    >
      <section
        className="admin-modal admin-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-delete-confirm-title"
      >
        <div className="admin-modal__header">
          <div>
            <span className="admin-eyebrow">DELETE SUBJECT</span>
            <h2 id="subject-delete-confirm-title">Xác nhận xóa môn học</h2>
            <p>
              Bạn có chắc chắn muốn xóa môn học "{subject.name}" không?
              Thao tác này không thể hoàn tác.
            </p>
          </div>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Đóng xác nhận" disabled={isPending}>
            ×
          </button>
        </div>
        <div className="admin-modal__footer">
          <button type="button" className="admin-secondary-btn" onClick={onClose} disabled={isPending}>Hủy</button>
          <button type="button" className="admin-danger-btn" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Đang xóa...' : 'Xóa môn học'}
          </button>
        </div>
      </section>
    </div>
  )
}
