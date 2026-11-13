import FrogLoading from '../../../../utils/FrogLoading'

export default function MissionFormModal({
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
      <section
        className="admin-modal admin-mission-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-modal-title"
      >
        <div className="admin-modal__header">
          <div>
            <span className="admin-eyebrow">MISSION</span>
            <h2 id="mission-modal-title">
              {mode === 'create' ? 'Thêm nhiệm vụ' : 'Chỉnh sửa nhiệm vụ'}
            </h2>
            <p>Nhập thông tin nhiệm vụ bên dưới.</p>
          </div>
          <button
            type="button"
            className="admin-modal__close"
            onClick={onClose}
            aria-label="Đóng modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="admin-modal__body">
            <div className="admin-form-grid admin-mission-form">
              <div className="admin-form-field">
                <label htmlFor="mission-name">Tên nhiệm vụ</label>
                <input
                  id="mission-name"
                  name="name"
                  value={form.name}
                  onChange={onFormChange}
                  required
                />
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="mission-description">Mô tả</label>
                <textarea
                  id="mission-description"
                  name="description"
                  value={form.description}
                  onChange={onFormChange}
                  rows={3}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="mission-type">Loại nhiệm vụ</label>
                <select
                  id="mission-type"
                  name="missionType"
                  value={form.missionType}
                  onChange={onFormChange}
                  required
                >
                  <optgroup label="Lớp học">
                    <option value="CLASS_CREATED">Tạo lớp học</option>
                    <option value="STUDENT_ADDED_TO_CLASS">Thêm học sinh vào lớp</option>
                  </optgroup>
                  <optgroup label="Tài liệu">
                    <option value="DOCUMENT_CREATED">Thêm tài liệu</option>
                    <option value="DOCUMENT_ASSIGNED">Giao tài liệu</option>
                  </optgroup>
                  <optgroup label="Đề thi">
                    <option value="EXAM_CREATED">Thêm đề thi</option>
                    <option value="EXAM_PUBLISHED">Xuất bản đề thi</option>
                  </optgroup>
                  <optgroup label="Bài tập">
                    <option value="HOMEWORK_CREATED">Thêm bài tập</option>
                    <option value="HOMEWORK_ASSIGNED">Giao bài tập</option>
                  </optgroup>
                  <optgroup label="Tương thích nhiệm vụ cũ">
                    <option value="FIRST_CLASS">Tạo lớp đầu tiên</option>
                    <option value="FIRST_EXAM">Tạo đề đầu tiên</option>
                    <option value="FIRST_PUBLISHED_EXAM">Xuất bản đề đầu tiên</option>
                    <option value="STUDENT_COUNT">Đạt số lượng học sinh</option>
                  </optgroup>
                </select>
              </div>

              <div className="admin-form-field">
                <label htmlFor="mission-reward">Point thưởng</label>
                <input
                  id="mission-reward"
                  name="rewardPoints"
                  type="number"
                  min="0"
                  value={form.rewardPoints}
                  onChange={onFormChange}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="mission-target">Mục tiêu</label>
                <input
                  id="mission-target"
                  name="targetValue"
                  type="number"
                  min="1"
                  value={form.targetValue}
                  onChange={onFormChange}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="mission-sort-order">Thứ tự</label>
                <input
                  id="mission-sort-order"
                  name="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={onFormChange}
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="mission-status">Trạng thái</label>
                <select
                  id="mission-status"
                  name="status"
                  value={form.status}
                  onChange={onFormChange}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            {formError && (
              <div className="admin-form-error" role="alert">
                {formError}
              </div>
            )}
          </div>

          <div className="admin-modal__footer">
            <button type="button" className="admin-secondary-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="admin-primary-btn" disabled={saving}>
              {saving ? (
                <FrogLoading compact label="Đang lưu..." />
              ) : mode === 'create' ? (
                '＋ Tạo nhiệm vụ'
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
