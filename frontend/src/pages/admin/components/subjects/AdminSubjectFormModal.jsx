import FrogLoading from '../../../../utils/FrogLoading'

export default function AdminSubjectFormModal({
  mode,
  form,
  formError,
  saving,
  onClose,
  onSubmit,
  onFormChange,
}) {
  if (!mode) return null

  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="subject-modal-title">
        <div className="admin-modal__header">
          <div>
            <span className="admin-eyebrow">SUBJECT</span>
            <h2 id="subject-modal-title">
              {mode === 'create' ? 'Thêm môn học' : 'Chỉnh sửa môn học'}
            </h2>
            <p>Nhập thông tin môn học bên dưới.</p>
          </div>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Đóng modal">×</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="admin-modal__body">
            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="subject-name">Tên môn học <span>*</span></label>
                <input id="subject-name" name="name" value={form.name} onChange={onFormChange} maxLength={100} required />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="subject-code">Mã môn học <span>*</span></label>
                <input id="subject-code" name="code" value={form.code} onChange={onFormChange} maxLength={50} required />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="subject-description">Mô tả</label>
                <textarea
                  id="subject-description"
                  name="description"
                  value={form.description}
                  onChange={onFormChange}
                  rows={4}
                />
              </div>
            </div>
            {formError && <div className="admin-form-error" role="alert">{formError}</div>}
          </div>
          <div className="admin-modal__footer">
            <button type="button" className="admin-secondary-btn" onClick={onClose}>Hủy</button>
            <button type="submit" className="admin-primary-btn" disabled={saving}>
              {saving
                ? <FrogLoading compact label="Đang lưu..." />
                : mode === 'create'
                  ? '＋ Tạo môn học'
                  : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
