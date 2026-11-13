import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ListChecks, Pencil, Power, XCircle } from 'lucide-react'
import useResourceQuery from '../../query/useResourceQuery'
import adminService from '../../services/adminService'
import FrogLoading from '../../utils/FrogLoading'
import MissionFormModal from './components/missions/MissionFormModal'
import MissionDeleteModal from './components/missions/MissionDeleteModal'

const emptyForm = {
  name: '',
  description: '',
  rewardPoints: 0,
  missionType: 'CLASS_CREATED',
  targetValue: 1,
  status: 'ACTIVE',
  sortOrder: 0,
}

const missionTypeLabels = {
  CLASS_CREATED: 'Tạo lớp học',
  STUDENT_ADDED_TO_CLASS: 'Thêm học sinh vào lớp',
  DOCUMENT_CREATED: 'Thêm tài liệu',
  DOCUMENT_ASSIGNED: 'Giao tài liệu',
  EXAM_CREATED: 'Thêm đề thi',
  EXAM_PUBLISHED: 'Xuất bản đề thi',
  HOMEWORK_CREATED: 'Thêm bài tập',
  HOMEWORK_ASSIGNED: 'Giao bài tập',
  FIRST_CLASS: 'Lớp học đầu tiên',
  FIRST_EXAM: 'Đề thi đầu tiên',
  FIRST_PUBLISHED_EXAM: 'Đề thi đã xuất bản',
  STUDENT_COUNT: 'Số lượng học sinh',
}

export default function MissionManagementPage() {
  const queryClient = useQueryClient()
  const {
    data: missions = [],
    isPending,
    error,
    queryKey,
  } = useResourceQuery('adminMissions')
  const [form, setForm] = useState(emptyForm)
  const [modalMode, setModalMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formError, setFormError] = useState('')
  const [deletingMission, setDeletingMission] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const activeMissionCount = missions.filter((mission) => mission.status === 'ACTIVE').length
  const inactiveMissionCount = missions.filter((mission) => mission.status === 'INACTIVE').length

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[2] === 'billingMissions',
    })
  }

  const save = useMutation({
    mutationFn: (payload) => (
      editing
        ? adminService.updateMission(editing.id, payload)
        : adminService.createMission(payload)
    ),
    onSuccess: () => {
      refresh()
      setModalMode(null)
      setEditing(null)
      setForm(emptyForm)
      setFormError('')
    },
    onError: (error) => {
      const responseMessage = error.response?.data?.message
      const validationErrors = error.response?.data?.validationErrors
      const validationMessage = validationErrors
        ? Object.values(validationErrors).join(', ')
        : ''
      setFormError(
        responseMessage
        || validationMessage
        || 'Không thể lưu nhiệm vụ. Vui lòng kiểm tra dữ liệu.',
      )
    },
  })

  const remove = useMutation({
    mutationFn: adminService.deleteMission,
    onMutate: async (missionId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousMissions = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (current = []) => (
        current.filter((mission) => mission.id !== missionId)
      ))
      return { previousMissions }
    },
    onError: (_error, _missionId, context) => {
      queryClient.setQueryData(queryKey, context?.previousMissions ?? [])
      setDeleteError('Không thể xóa nhiệm vụ. Vui lòng thử lại.')
    },
    onSuccess: () => {
      refresh()
      setDeletingMission(null)
    },
  })

  function submit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.description.trim()) {
      setFormError('Vui lòng nhập tên và mô tả nhiệm vụ.')
      return
    }
    setFormError('')
    save.mutate({
      ...form,
      rewardPoints: Number(form.rewardPoints),
      targetValue: Number(form.targetValue),
      sortOrder: Number(form.sortOrder),
    })
  }

  function edit(mission) {
    setModalMode('edit')
    setEditing(mission)
    setForm({
      name: mission.name,
      description: mission.description,
      rewardPoints: mission.rewardPoints,
      missionType: mission.missionType,
      targetValue: mission.targetValue,
      status: mission.status,
      sortOrder: mission.sortOrder,
    })
  }

  function resetForm() {
    setModalMode('create')
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function closeModal() {
    if (!save.isPending) {
      setModalMode(null)
      setEditing(null)
      setFormError('')
    }
  }

  function confirmDelete() {
    if (deletingMission) remove.mutate(deletingMission.id)
  }

  return (
    <div className="admin-users-page admin-mission-page">
      <div className="admin-users-heading">
        <div>
          <span className="admin-eyebrow">MISSION MANAGEMENT</span>
          <h2>Quản lý nhiệm vụ</h2>
          <p>Tạo và điều chỉnh nhiệm vụ nhận Point cho giáo viên.</p>
        </div>
        <button
          type="button"
          className="admin-primary-btn"
          onClick={resetForm}
        >
          ＋ Nhiệm vụ mới
        </button>
      </div>

      <div className="admin-stats admin-mission-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon blue">
            <ListChecks size={21} strokeWidth={1.8} />
          </div>
          <span>Tổng nhiệm vụ</span>
          <strong>{isPending ? <FrogLoading compact label="" /> : missions.length}</strong>
          <small>Tất cả nhiệm vụ trong hệ thống</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon purple">
            <CheckCircle2 size={21} strokeWidth={1.8} />
          </div>
          <span>Đang hoạt động</span>
          <strong>{isPending ? <FrogLoading compact label="" /> : activeMissionCount}</strong>
          <small>Đang hiển thị cho giáo viên</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon orange">
            <XCircle size={21} strokeWidth={1.8} />
          </div>
          <span>Đã vô hiệu hóa</span>
          <strong>{isPending ? <FrogLoading compact label="" /> : inactiveMissionCount}</strong>
          <small>Không còn hiển thị cho giáo viên</small>
        </div>
      </div>

      {error && (
        <p className="admin-data-error" role="alert">
          Không thể tải danh sách nhiệm vụ.
        </p>
      )}

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <h3>Danh sách nhiệm vụ</h3>
            <p>Thay đổi sẽ được dùng ngay ở tab nhiệm vụ của giáo viên.</p>
          </div>
          <span className="admin-result-count">
            {isPending
              ? <FrogLoading compact label="Đang tải..." />
              : `${missions.length} nhiệm vụ`}
          </span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mã</th>
                <th>Loại</th>
                <th>Point</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {missions.map((mission) => (
                <tr key={mission.id}>
                  <td className="admin-mission-name">
                    <strong>{mission.name}</strong>
                    <small>{mission.description}</small>
                  </td>
                  <td>
                    <span className="admin-mission-code">{mission.code}</span>
                  </td>
                  <td>
                    <span className="admin-mission-type">
                      {missionTypeLabels[mission.missionType] || mission.missionType}
                    </span>
                  </td>
                  <td>
                    <span className="admin-mission-points">
                      +{mission.rewardPoints} Point
                    </span>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${mission.status.toLowerCase()}`}>
                      <span />
                      {mission.status === 'ACTIVE' ? 'Hoạt động' : 'Đã vô hiệu hóa'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-mission-action admin-mission-action--edit"
                      onClick={() => edit(mission)}
                    >
                      <Pencil size={15} />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      className="admin-mission-action admin-mission-action--delete"
                      disabled={remove.isPending}
                      onClick={() => {
                        setDeleteError('')
                        setDeletingMission(mission)
                      }}
                    >
                      <Power size={15} />
                      <span>Xóa</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <MissionFormModal
        mode={modalMode}
        form={form}
        formError={formError}
        saving={save.isPending}
        onClose={closeModal}
        onSubmit={submit}
        onFormChange={updateField}
      />
      <MissionDeleteModal
        mission={deletingMission}
        isPending={remove.isPending}
        onClose={() => setDeletingMission(null)}
        onConfirm={confirmDelete}
      />
      {deleteError && (
        <div className="admin-modal-overlay" role="presentation">
          <section className="admin-modal admin-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="mission-delete-error-title">
            <div className="admin-modal__header">
              <div>
                <span className="admin-eyebrow">MISSION STATUS</span>
                <h2 id="mission-delete-error-title">Không thể xóa nhiệm vụ</h2>
                <p>{deleteError}</p>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="admin-primary-btn" onClick={() => setDeleteError('')}>Đã hiểu</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
