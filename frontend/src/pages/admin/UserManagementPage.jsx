import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import adminService from '../../services/adminService'
import useAuthStore from '../../stores/authStore'

const statusLabels = {
  ACTIVE: 'Hoạt động',
  PENDING: 'Chờ duyệt',
  BANNED: 'Đã khóa',
}

const emptyForm = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  role: 'STUDENT',
  status: 'ACTIVE',
  password: '',
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback
}

export default function UserManagementPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const startImpersonation = useAuthStore((state) => state.startImpersonation)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalMode, setModalMode] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const { data: users = [], isPending, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getUsers,
  })

  const refreshAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: adminService.createUser,
    onSuccess: refreshAdminData,
  })
  const updateMutation = useMutation({
    mutationFn: ({ userId, user }) => adminService.updateUser(userId, user),
    onSuccess: refreshAdminData,
  })
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: refreshAdminData,
  })
  const impersonationMutation = useMutation({
    mutationFn: adminService.startImpersonation,
    onSuccess: (targetUser) => {
      startImpersonation(targetUser)
      navigate(targetUser.role === 'TEACHER' ? '/teacher' : '/student', { replace: true })
    },
    onError: (mutationError) => {
      window.alert(getErrorMessage(mutationError, 'Không thể đăng nhập với tư cách tài khoản này. Vui lòng thử lại.'))
    },
  })
  const saving = createMutation.isPending || updateMutation.isPending

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return users.filter((user) => {
      const matchesKeyword = [
        user.name,
        user.username,
        user.email,
      ].some((value) => String(value ?? '').toLowerCase().includes(normalizedKeyword))

      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
      return matchesKeyword && matchesRole && matchesStatus
    })
  }, [users, keyword, roleFilter, statusFilter])

  const studentCount = users.filter((user) => user.role === 'STUDENT').length
  const teacherCount = users.filter((user) => user.role === 'TEACHER').length

  function openCreateModal() {
    setSelectedUser(null)
    setForm({ ...emptyForm })
    setFormError('')
    setModalMode('create')
  }

  function openUserModal(user, mode) {
    setSelectedUser(user)
    setForm({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      status: user.status,
      password: '',
    })
    setFormError('')
    setModalMode(mode)
  }

  function closeModal() {
    setModalMode(null)
    setSelectedUser(null)
    setFormError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password || null,
    }

    const mutation = modalMode === 'create'
      ? createMutation.mutateAsync(payload)
      : updateMutation.mutateAsync({ userId: selectedUser.id, user: payload })

    mutation.then(closeModal).catch((mutationError) => {
      setFormError(getErrorMessage(mutationError, 'Không thể lưu tài khoản. Vui lòng thử lại.'))
    })
  }

  function handleDelete(user) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.name}" không?`)) {
      return
    }

    deleteMutation.mutate(user.id, {
      onError: (mutationError) => {
        window.alert(getErrorMessage(mutationError, 'Không thể xóa tài khoản. Vui lòng thử lại.'))
      },
    })
  }

  function handleImpersonate(user) {
    if (user.status !== 'ACTIVE' || !['STUDENT', 'TEACHER'].includes(user.role)) return
    if (!window.confirm(`Bạn sẽ chuyển sang sử dụng hệ thống với tư cách "${user.name}". Tiếp tục?`)) return
    const reason = window.prompt('Lý do impersonate (không bắt buộc):')
    if (reason === null) return
    impersonationMutation.mutate({ userId: user.id, reason: reason.trim() })
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function getRoleLabel(role) {
    if (role === 'STUDENT') return 'Học sinh'
    if (role === 'TEACHER') return 'Giáo viên'
    return role
  }

  function getInitial(name) {
    return name?.trim().charAt(0).toUpperCase() || 'U'
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-heading">
        <div>
          <span className="admin-eyebrow">USER MANAGEMENT</span>
          <h2>Quản lý tài khoản</h2>
          <p>Dữ liệu tài khoản được tải trực tiếp từ cơ sở dữ liệu.</p>
        </div>
        <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
          <span>＋</span> Thêm tài khoản
        </button>
      </div>

      {error && (
        <p className="admin-data-error" role="alert">
          Không thể tải danh sách tài khoản. Vui lòng tải lại trang hoặc đăng nhập lại.
        </p>
      )}

      <div className="admin-stats admin-users-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon blue">♙</div>
          <span>Tổng tài khoản</span>
          <strong>{isPending ? '...' : users.length}</strong>
          <small>Học sinh và giáo viên</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon purple">♧</div>
          <span>Học sinh</span>
          <strong>{isPending ? '...' : studentCount}</strong>
          <small>Tài khoản học sinh</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon orange">♙</div>
          <span>Giáo viên</span>
          <strong>{isPending ? '...' : teacherCount}</strong>
          <small>Tài khoản giáo viên</small>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <h3>Danh sách tài khoản</h3>
            <p>Tìm kiếm, xem và quản lý tài khoản học sinh, giáo viên.</p>
          </div>
          <span className="admin-result-count">
            {isPending ? 'Đang tải...' : `${filteredUsers.length} tài khoản`}
          </span>
        </div>

        <div className="admin-user-filters">
          <div className="admin-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Tìm theo tên, username hoặc email..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <select aria-label="Lọc theo vai trò" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="ALL">Tất cả vai trò</option>
            <option value="STUDENT">Học sinh</option>
            <option value="TEACHER">Giáo viên</option>
          </select>
          <select aria-label="Lọc theo trạng thái" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="BANNED">Đã khóa</option>
          </select>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-user-table">
            <thead>
              <tr>
                <th>NGƯỜI DÙNG</th>
                <th>TÊN ĐĂNG NHẬP</th>
                <th>VAI TRÒ</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isPending && <tr><td colSpan={5}>Đang tải dữ liệu tài khoản...</td></tr>}
              {!isPending && filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span className="admin-user-info">
                      <span className="admin-user-avatar">{getInitial(user.name)}</span>
                      <span className="admin-user-info__text">
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </span>
                    </span>
                  </td>
                  <td><span className="admin-username">{user.username}</span></td>
                  <td>
                    <span className={`admin-role-badge ${user.role === 'STUDENT' ? 'student' : 'teacher'}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${user.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      <span />
                      {statusLabels[user.status] ?? user.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" className="admin-icon-btn view" title="Xem chi tiết" aria-label={`Xem ${user.name}`} onClick={() => openUserModal(user, 'view')}>◉</button>
                      {user.status === 'ACTIVE' && (
                        <button
                          type="button"
                          className="admin-icon-btn impersonate"
                          title="Đăng nhập với tư cách người dùng"
                          aria-label={`Impersonate ${user.name}`}
                          disabled={impersonationMutation.isPending}
                          onClick={() => handleImpersonate(user)}
                        >⇥</button>
                      )}
                      <button type="button" className="admin-icon-btn edit" title="Chỉnh sửa" aria-label={`Sửa ${user.name}`} onClick={() => openUserModal(user, 'edit')}>✎</button>
                      <button type="button" className="admin-icon-btn delete" title="Xóa tài khoản" aria-label={`Xóa ${user.name}`} disabled={deleteMutation.isPending} onClick={() => handleDelete(user)}>♲</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isPending && !error && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-no-results">
                      <span>⌕</span>
                      <strong>Không tìm thấy tài khoản</strong>
                      <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalMode && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
            <div className="admin-modal__header">
              <div>
                <span className="admin-eyebrow">USER ACCOUNT</span>
                <h2 id="admin-modal-title">
                  {modalMode === 'create' ? 'Thêm tài khoản' : modalMode === 'edit' ? 'Chỉnh sửa tài khoản' : 'Chi tiết tài khoản'}
                </h2>
                <p>{modalMode === 'view' ? 'Thông tin tài khoản trong hệ thống.' : 'Nhập thông tin tài khoản bên dưới.'}</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={closeModal} aria-label="Đóng modal">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal__body">
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label htmlFor="user-name">Họ và tên <span>*</span></label>
                    <input id="user-name" name="fullName" value={form.fullName} onChange={handleFormChange} disabled={modalMode === 'view'} minLength={2} maxLength={100} required />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor="user-username">Tên đăng nhập <span>*</span></label>
                    <input id="user-username" name="username" value={form.username} onChange={handleFormChange} disabled={modalMode === 'view'} maxLength={50} required />
                  </div>
                  <div className="admin-form-field admin-form-field--full">
                    <label htmlFor="user-email">Email <span>*</span></label>
                    <input id="user-email" name="email" type="email" value={form.email} onChange={handleFormChange} disabled={modalMode === 'view'} maxLength={255} required />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor="user-phone">Số điện thoại</label>
                    <input
                      id="user-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleFormChange}
                      disabled={modalMode === 'view'}
                      inputMode="numeric"
                      pattern="^(0[35789])[0-9]{8}$"
                      maxLength={10}
                      placeholder="Ví dụ: 0912345678"
                    />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor="user-role">Vai trò</label>
                    <select id="user-role" name="role" value={form.role} onChange={handleFormChange} disabled={modalMode === 'view'}>
                      <option value="STUDENT">Học sinh</option>
                      <option value="TEACHER">Giáo viên</option>
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor="user-status">Trạng thái</label>
                    <select id="user-status" name="status" value={form.status} onChange={handleFormChange} disabled={modalMode === 'view'}>
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="PENDING">Chờ duyệt</option>
                      <option value="BANNED">Đã khóa</option>
                    </select>
                  </div>
                  {modalMode !== 'view' && (
                    <div className="admin-form-field admin-form-field--full">
                      <label htmlFor="user-password">
                        Mật khẩu {modalMode === 'create' && <span>*</span>}
                      </label>
                      <input
                        id="user-password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleFormChange}
                        autoComplete="new-password"
                        minLength={modalMode === 'create' ? 8 : undefined}
                        maxLength={72}
                        required={modalMode === 'create'}
                        placeholder={modalMode === 'edit' ? 'Để trống nếu không đổi mật khẩu' : 'Tối thiểu 8 ký tự'}
                      />
                    </div>
                  )}
                </div>
                {formError && <div className="admin-form-error" role="alert">{formError}</div>}
              </div>
              <div className="admin-modal__footer">
                <button type="button" className="admin-secondary-btn" onClick={closeModal}>
                  {modalMode === 'view' ? 'Đóng' : 'Hủy'}
                </button>
                {modalMode !== 'view' && (
                  <button type="submit" className="admin-primary-btn" disabled={saving}>
                    {saving ? 'Đang lưu...' : modalMode === 'create' ? '＋ Tạo tài khoản' : 'Lưu thay đổi'}
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
