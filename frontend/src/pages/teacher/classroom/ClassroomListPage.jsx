import { useNavigate } from 'react-router-dom'

import DashboardLayout from '../../../layouts/DashboardLayout'
import ClassroomFilters from './components/ClassroomFilters'
import ClassroomGrid from './components/ClassroomGrid'
import ClassroomHeader from './components/ClassroomHeader'
import ClassroomStats from './components/ClassroomStats'
import ClassroomToast from './components/ClassroomToast'
import useClassrooms from './hooks/useClassrooms'
import ClassroomFormModal from './modals/ClassroomFormModal'
import ConfirmModal from './modals/ConfirmModal'

function ClassroomListPage() {
  const navigate = useNavigate()
  const classroom = useClassrooms()

  return (
    <DashboardLayout>
      <ClassroomToast
        toast={classroom.toast}
        onClose={() => classroom.setToast(null)}
      />

      <ClassroomHeader
        onCreate={() => {
          classroom.setCreateError(null)
          classroom.setIsCreateModalOpen(true)
        }}
      />

      <ClassroomStats
        total={classroom.totalClasses}
        active={classroom.activeClasses}
        archived={classroom.archivedClasses}
      />

      <ClassroomFilters
        search={classroom.search}
        onSearchChange={classroom.setSearch}
        statusFilters={classroom.statusFilters}
        selectedStatus={classroom.selectedStatus}
        onStatusChange={classroom.setSelectedStatus}
        resultCount={classroom.filteredClasses.length}
        totalCount={classroom.totalClasses}
      />

      <ClassroomGrid
        loading={classroom.loading}
        error={classroom.error}
        classrooms={classroom.filteredClasses}
        onView={(item) => navigate(`/teacher/classes/${item.id}`)}
        onEdit={classroom.handleEdit}
        onArchive={classroom.handleArchive}
        onDelete={classroom.handleDelete}
      />

      <ClassroomFormModal
        isOpen={classroom.isCreateModalOpen}
        error={classroom.createError}
        onClearError={() => classroom.setCreateError(null)}
        onClose={() => {
          if (!classroom.creating) {
            classroom.setIsCreateModalOpen(false)
            classroom.setCreateError(null)
          }
        }}
        onSubmit={classroom.handleCreateSubmit}
        submitting={classroom.creating}
        renderedClasses={classroom.filteredClasses}
      />

      <ClassroomFormModal
        isOpen={!!classroom.editingClass}
        initialData={classroom.editingClass}
        mode="edit"
        error={classroom.editError}
        onClearError={() => classroom.setEditError(null)}
        submitting={classroom.updating}
        onClose={() => {
          if (!classroom.updating) {
            classroom.setEditingClass(null)
            classroom.setEditError(null)
          }
        }}
        onSubmit={classroom.handleEditSubmit}
        renderedClasses={classroom.filteredClasses}
      />

      <ConfirmModal
        open={!!classroom.confirmAction}
        loading={classroom.actionLoading}
        danger={classroom.confirmAction?.type === 'delete'}
        title={
          classroom.confirmAction?.type === 'archive'
            ? 'Vô hiệu lớp học'
            : 'Xóa lớp học'
        }
        description={
          classroom.confirmAction?.type === 'archive'
            ? `Bạn có chắc chắn muốn vô hiệu lớp "${classroom.confirmAction?.classroom?.name}" không?`
            : `Bạn có chắc chắn muốn xóa vĩnh viễn lớp "${classroom.confirmAction?.classroom?.name}" không? Hành động này không thể hoàn tác.`
        }
        confirmText={
          classroom.confirmAction?.type === 'archive' ? 'Vô hiệu' : 'Xóa lớp'
        }
        onClose={() => {
          if (!classroom.actionLoading) classroom.setConfirmAction(null)
        }}
        onConfirm={classroom.handleConfirmAction}
      />
    </DashboardLayout>
  )
}

export default ClassroomListPage
