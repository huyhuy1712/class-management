import { Check, LockKeyhole, LogIn, Pencil, Trash2, UnlockKeyhole } from 'lucide-react'
import defaultAvatar from '../../../../assets/images/avatar_default.png'
import { getRoleLabel, statusLabels } from '../../helpers/userManagementHelpers'

export default function AdminUserTable({
  users,
  isPending,
  error,
  approvePending,
  blockPending,
  deletePending,
  impersonationPending,
  onToggleBlocked,
  onEdit,
  onApprove,
  onImpersonate,
  onDelete,
}) {
  return (
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
          {!isPending && users.map((user) => (
            <tr key={user.id}>
              <td>
                <span className="admin-user-info">
                  <img
                    className="admin-user-avatar"
                    src={user.avatar || defaultAvatar}
                    alt={`${user.name} avatar`}
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = defaultAvatar
                    }}
                  />
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
                  <button
                    type="button"
                    className={`admin-icon-btn ${user.status === 'BANNED' ? 'unblock' : 'block'}`}
                    title={user.status === 'BANNED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                    aria-label={`${user.status === 'BANNED' ? 'Mở khóa' : 'Khóa'} tài khoản ${user.name}`}
                    disabled={blockPending || !['ACTIVE', 'BANNED'].includes(user.status)}
                    onClick={() => onToggleBlocked(user)}
                  >
                    {user.status === 'BANNED'
                      ? <UnlockKeyhole size={17} strokeWidth={2} />
                      : <LockKeyhole size={17} strokeWidth={2} />}
                    <span>
                      {blockPending
                        ? 'Đang xử lý...'
                        : user.status === 'BANNED'
                          ? 'Mở khóa'
                          : 'Khóa'}
                    </span>
                  </button>
                  {user.status === 'ACTIVE' && (
                    <button
                      type="button"
                      className="admin-icon-btn impersonate"
                      title="Đăng nhập với tư cách người dùng"
                      aria-label={`Impersonate ${user.name}`}
                      disabled={impersonationPending}
                      onClick={() => onImpersonate(user)}
                    >
                      <LogIn size={17} strokeWidth={2} />
                      <span>Đăng nhập</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="admin-icon-btn edit"
                    title="Chỉnh sửa"
                    aria-label={`Sửa ${user.name}`}
                    onClick={() => onEdit(user)}
                  >
                    <Pencil size={17} strokeWidth={2} />
                    <span>Sửa</span>
                  </button>
                  {user.status === 'PENDING' && (
                    <button
                      type="button"
                      className="admin-icon-btn approve"
                      title="Duyệt tài khoản"
                      aria-label={`Duyệt tài khoản ${user.name}`}
                      disabled={approvePending}
                      onClick={() => onApprove(user)}
                    >
                      <Check size={17} strokeWidth={2.2} />
                      <span>{approvePending ? 'Đang duyệt...' : 'Duyệt'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="admin-icon-btn delete"
                    title="Xóa tài khoản"
                    aria-label={`Xóa tài khoản ${user.name}`}
                    disabled={deletePending}
                    onClick={() => onDelete(user)}
                  >
                    <Trash2 size={17} strokeWidth={2} />
                    <span>Xóa</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!isPending && !error && users.length === 0 && (
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
  )
}
