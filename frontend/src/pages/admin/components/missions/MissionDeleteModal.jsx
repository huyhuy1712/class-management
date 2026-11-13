import FrogLoading from '../../../../utils/FrogLoading'

export default function MissionDeleteModal({ mission, isPending, onClose, onConfirm }) {
  if (!mission) return null

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
        aria-labelledby="mission-delete-confirm-title"
      >
        <div className="admin-modal__header">
          <div>
            <span className="admin-eyebrow">DELETE MISSION</span>
            <h2 id="mission-delete-confirm-title">Xóa nhiệm vụ?</h2>
            <p>
              Bạn có chắc chắn muốn xóa nhiệm vụ "{mission.name}" không?
              Point giáo viên đã nhận sẽ được giữ nguyên.
            </p>
          </div>
          <button
            type="button"
            className="admin-modal__close"
            onClick={onClose}
            aria-label="Đóng xác nhận"
            disabled={isPending}
          >
            ×
          </button>
        </div>
        <div className="admin-modal__footer">
          <button type="button" className="admin-secondary-btn" onClick={onClose} disabled={isPending}>
            Hủy
          </button>
          <button type="button" className="admin-danger-btn" onClick={onConfirm} disabled={isPending}>
            {isPending ? <FrogLoading compact label="Đang xóa..." /> : 'Xóa nhiệm vụ'}
          </button>
        </div>
      </section>
    </div>
  )
}
