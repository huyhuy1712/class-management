import AdminSubjectDeleteModal from './components/subjects/AdminSubjectDeleteModal'
import AdminSubjectFormModal from './components/subjects/AdminSubjectFormModal'
import AdminSubjectStats from './components/subjects/AdminSubjectStats'
import AdminSubjectTable from './components/subjects/AdminSubjectTable'
import useAdminSubjectManagement from './hooks/useAdminSubjectManagement'

export default function SubjectManagementPage() {
  const management = useAdminSubjectManagement()

  return (
    <div className="admin-users-page">
      <div className="admin-users-heading">
        <div>
          <span className="admin-eyebrow">SUBJECT MANAGEMENT</span>
          <h2>Quản lý môn học</h2>
          <p>Thêm, cập nhật và xóa các môn học trong hệ thống.</p>
        </div>
        <button type="button" className="admin-primary-btn" onClick={management.openCreateModal}>
          <span>＋</span> Thêm môn học
        </button>
      </div>

      {management.error && (
        <p className="admin-data-error" role="alert">
          Không thể tải danh sách môn học. Vui lòng tải lại trang hoặc đăng nhập lại.
        </p>
      )}

      <AdminSubjectStats isPending={management.isPending} count={management.subjects.length} />

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <h3>Danh sách môn học</h3>
            <p>Tìm kiếm theo tên, mã hoặc mô tả môn học.</p>
          </div>
          <span className="admin-result-count">
            {management.isPending ? 'Đang tải...' : `${management.filteredSubjects.length} môn học`}
          </span>
        </div>

        <div className="admin-user-filters">
          <div className="admin-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Tìm theo tên, mã hoặc mô tả..."
              value={management.keyword}
              onChange={(event) => management.setKeyword(event.target.value)}
              aria-label="Tìm môn học"
            />
          </div>
        </div>

        <AdminSubjectTable
          subjects={management.filteredSubjects}
          totalSubjects={management.subjects.length}
          isPending={management.isPending}
          error={management.error}
          deletePending={management.deleteMutation.isPending}
          onEdit={management.openEditModal}
          onDelete={management.setPendingDelete}
        />
      </section>

      <AdminSubjectFormModal
        mode={management.modalMode}
        form={management.form}
        formError={management.formError}
        saving={management.saving}
        onClose={management.closeModal}
        onSubmit={management.handleSubmit}
        onFormChange={management.handleFormChange}
      />

      <AdminSubjectDeleteModal
        subject={management.pendingDelete}
        isPending={management.deleteMutation.isPending}
        onClose={management.closeDeleteModal}
        onConfirm={management.confirmDelete}
      />
    </div>
  )
}
