import defaultAvatar from '../../../../assets/images/avatar_default.png'
import { statusLabels } from '../../helpers/userManagementHelpers'

export default function AdminUserModal({
  mode,
  selectedUser,
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
        className={`admin-modal admin-user-modal ${mode === 'view' ? 'admin-modal--view' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
        <div className="admin-modal__header">
          <div>
            <span className="admin-eyebrow">USER ACCOUNT</span>
            <h2 id="admin-modal-title">
              {mode === 'create' ? 'Thêm tài khoản' : mode === 'edit' ? 'Chỉnh sửa tài khoản' : 'Chi tiết tài khoản'}
            </h2>
            <p>{mode === 'view' ? 'Thông tin tài khoản trong hệ thống.' : 'Nhập thông tin tài khoản bên dưới.'}</p>
            {selectedUser && (
              <div className="admin-user-modal__identity">
                <img
                  src={selectedUser.avatar || defaultAvatar}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = defaultAvatar
                  }}
                />
                <div>
                  <strong>{selectedUser.fullName}</strong>
                  <span>{selectedUser.email}</span>
                </div>
                <span className={`admin-user-modal__status ${selectedUser.status.toLowerCase()}`}>
                  {statusLabels[selectedUser.status] ?? selectedUser.status}
                </span>
              </div>
            )}
          </div>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Đóng modal">×</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="admin-modal__body">
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label htmlFor="user-name">Họ và tên <span>*</span></label>
                <input id="user-name" name="fullName" value={form.fullName} onChange={onFormChange} disabled={mode === 'view'} minLength={2} maxLength={100} required />
              </div>
              <div className="admin-form-field">
                <label htmlFor="user-username">Tên đăng nhập <span>*</span></label>
                <input id="user-username" name="username" value={form.username} onChange={onFormChange} disabled={mode === 'view'} maxLength={50} required />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="user-email">Email <span>*</span></label>
                <input id="user-email" name="email" type="email" value={form.email} onChange={onFormChange} disabled={mode === 'view'} maxLength={255} required />
              </div>
              <div className="admin-form-field">
                <label htmlFor="user-phone">Số điện thoại</label>
                <input
                  id="user-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={onFormChange}
                  disabled={mode === 'view'}
                  inputMode="numeric"
                  pattern="^(0[35789])[0-9]{8}$"
                  maxLength={10}
                  placeholder="Ví dụ: 0912345678"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="user-role">Vai trò</label>
                <select id="user-role" name="role" value={form.role} onChange={onFormChange} disabled={mode === 'view'}>
                  <option value="STUDENT">Học sinh</option>
                  <option value="TEACHER">Giáo viên</option>
                </select>
              </div>
              {mode !== 'view' && (
                <div className="admin-form-field admin-form-field--full">
                  <label htmlFor="user-password">
                    Mật khẩu {mode === 'create' && <span>*</span>}
                  </label>
                  <input
                    id="user-password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={onFormChange}
                    autoComplete="new-password"
                    minLength={mode === 'create' ? 8 : undefined}
                    maxLength={72}
                    required={mode === 'create'}
                    placeholder={mode === 'edit' ? 'Để trống nếu không đổi mật khẩu' : 'Tối thiểu 8 ký tự'}
                  />
                </div>
              )}
            </div>
            {formError && <div className="admin-form-error" role="alert">{formError}</div>}
          </div>
          <div className="admin-modal__footer">
            <button type="button" className="admin-secondary-btn" onClick={onClose}>
              {mode === 'view' ? 'Đóng' : 'Hủy'}
            </button>
            {mode !== 'view' && (
              <button type="submit" className="admin-primary-btn" disabled={saving}>
                {saving ? 'Đang lưu...' : mode === 'create' ? '＋ Tạo tài khoản' : 'Lưu thay đổi'}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
