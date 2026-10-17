import AdminUserActionModal from './components/users/AdminUserActionModal'
import AdminUserFilters from './components/users/AdminUserFilters'
import AdminUserModal from './components/users/AdminUserModal'
import AdminUserStats from './components/users/AdminUserStats'
import AdminUserTable from './components/users/AdminUserTable'
import AdminActionToast from './components/AdminActionToast'
import useAdminUserManagement from './hooks/useAdminUserManagement'
import FrogLoading from '../../utils/FrogLoading'

export default function UserManagementPage() {
  const management = useAdminUserManagement()

  return (
    <div className="admin-users-page">
      <div className="admin-users-heading">
        <div>
          <span className="admin-eyebrow">USER MANAGEMENT</span>
          <h2>Quản lý tài khoản</h2>
          <p>Dữ liệu tài khoản được tải trực tiếp từ cơ sở dữ liệu.</p>
        </div>
        <button type="button" className="admin-primary-btn" onClick={management.openCreateModal}>
          <span>＋</span> Thêm tài khoản
        </button>
      </div>

      {management.error && (
        <p className="admin-data-error" role="alert">
          Không thể tải danh sách tài khoản. Vui lòng tải lại trang hoặc đăng nhập lại.
        </p>
      )}

      <AdminUserStats
        isPending={management.isPending}
        users={management.users}
        studentCount={management.studentCount}
        teacherCount={management.teacherCount}
      />

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <h3>Danh sách tài khoản</h3>
            <p>Tìm kiếm, xem và quản lý tài khoản học sinh, giáo viên.</p>
          </div>
          <span className="admin-result-count">
            {management.isPending
              ? <FrogLoading compact label="Đang tải tài khoản..." />
              : `${management.filteredUsers.length} tài khoản`}
          </span>
        </div>

        <AdminUserFilters
          keyword={management.keyword}
          onKeywordChange={management.setKeyword}
          roleFilter={management.roleFilter}
          onRoleFilterChange={management.setRoleFilter}
          statusFilter={management.statusFilter}
          onStatusFilterChange={management.setStatusFilter}
        />

        <AdminUserTable
          users={management.filteredUsers}
          isPending={management.isPending}
          error={management.error}
          approvePending={management.approveMutation.isPending}
          blockPending={management.blockMutation.isPending}
          deletePending={management.deleteMutation.isPending}
          impersonationPending={management.impersonationMutation.isPending}
          onToggleBlocked={management.handleToggleBlocked}
          onEdit={(user) => management.openUserModal(user, 'edit')}
          onApprove={management.handleApprove}
          onImpersonate={management.handleImpersonate}
          onDelete={management.handleDelete}
        />
      </section>

      <AdminUserModal
        mode={management.modalMode}
        selectedUser={management.selectedUser}
        form={management.form}
        formError={management.formError}
        saving={management.saving}
        onClose={management.closeModal}
        onSubmit={management.handleSubmit}
        onFormChange={management.handleFormChange}
      />

      <AdminUserActionModal
        action={management.pendingAction}
        impersonationReason={management.impersonationReason}
        deletePending={management.deleteMutation.isPending}
        impersonationPending={management.impersonationMutation.isPending}
        onClose={management.closePendingAction}
        onReasonChange={management.setImpersonationReason}
        onConfirm={management.confirmPendingAction}
      />

      <AdminActionToast toast={management.toast} onClose={() => management.setToast(null)} />
    </div>
  )
}
