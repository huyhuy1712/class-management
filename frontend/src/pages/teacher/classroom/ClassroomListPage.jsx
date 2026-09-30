import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  CheckCircle2,
  Plus,
  Search,
  School,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import DashboardLayout from '../../../layouts/DashboardLayout'
import ClassCard from '../../../components/classroom/ClassroomCard'
import ClassFormModal from '../../../components/classroom/ClassroomFormModal'
import classroomService from '../../../services/classroomService'
import useAuthStore from '../../../stores/authStore'
import ConfirmModal from '../../../components/classroom/ConfirmModal'

function getCurrentAcademicYear() {
  const currentYear = new Date().getFullYear()

  return `${currentYear}-${currentYear + 1}`
}

function getErrorMessage(responseData) {
  if (!responseData) return ''

  if (typeof responseData === 'string') {
    return responseData
  }

  if (responseData.message) return responseData.message
  if (responseData.error) return responseData.error

  if (responseData.errors) {
    return Object.values(responseData.errors)
      .flat()
      .join(' ')
  }

  return JSON.stringify(responseData)
}

function ClassListPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const currentUserId = currentUser?.id

  const [classes, setClasses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingClass, setEditingClass] = useState(null)
  const [editError, setEditError] = useState(null)
  const [updating, setUpdating] = useState(false)

  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  useEffect(() => {
    let cancelled = false

    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)

        const myClasses = await classroomService.getMyClasses()

        if (!cancelled) {
          setClasses(myClasses)
        }
      } catch (fetchError) {
        console.error('Get classes error:', fetchError)

        if (!cancelled) {
          setError('Không thể tải danh sách lớp học.')
          setClasses([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchClasses()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 3500)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const totalClasses = classes.length
  const activeClasses = classes.filter(
    (classroom) => classroom.status === 'ACTIVE',
  ).length
  const archivedClasses = classes.filter(
    (classroom) => classroom.status === 'ARCHIVED',
  ).length

  const filteredClasses = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return classes.filter((classroom) => {
      const matchesSearch =
        !keyword ||
        String(classroom.name ?? '').toLowerCase().includes(keyword) ||
        String(classroom.code ?? '').toLowerCase().includes(keyword) ||
        String(classroom.subjectName ?? '').toLowerCase().includes(keyword)
      const matchesStatus =
        selectedStatus === 'ALL' || classroom.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [classes, search, selectedStatus])

  const statusFilters = [
    { value: 'ALL', label: 'Tất cả', count: totalClasses },
    { value: 'ACTIVE', label: 'Đang hoạt động', count: activeClasses },
    { value: 'ARCHIVED', label: 'Đã vô hiệu', count: archivedClasses },
  ]

  const handleCreateSubmit = async (formData) => {
    if (!currentUserId) {
      setCreateError('Không tìm thấy thông tin người dùng đang đăng nhập.')
      return
    }

    const normalizedCode = formData.code.trim().toLowerCase()
    const codeAlreadyExists = classes.some(
      (classroom) =>
        classroom.code?.trim().toLowerCase() === normalizedCode,
    )

    if (codeAlreadyExists) {
      setCreateError('Mã lớp đã tồn tại. Vui lòng chọn mã khác.')
      return
    }

    try {
      setCreating(true)
      setCreateError(null)

      const payload = {
        name: formData.name,
        code: formData.code,
        subjectId: formData.subjectId,
        teacherId: currentUserId,
        academicYear: getCurrentAcademicYear(),
        description: formData.description,
      }

      const createdClass = await classroomService.create(payload)

      setClasses((prev) => [
        {
          ...createdClass,
          academicYear: createdClass.academicYear || payload.academicYear,
        },
        ...prev,
      ])

      setIsCreateModalOpen(false)
      setToast({
        type: 'success',
        message: 'Tạo lớp học thành công.',
      })
    } catch (error) {
      console.error('Create class error:', error)

      const responseData = error.response?.data
      const backendMessage = getErrorMessage(responseData)
      const isDuplicateCodeError =
        error.response?.status === 409 ||
        /mã lớp|class.?code|code.*(exist|duplicate|unique)|already exists|duplicate|đã tồn tại/i.test(
          backendMessage,
        )

      const message = isDuplicateCodeError
        ? 'Mã lớp đã tồn tại. Vui lòng chọn mã khác.'
        : backendMessage ||
          `Không thể tạo lớp học (HTTP ${error.response?.status || 'unknown'}).`

      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (classroom) => {
    setEditError(null)
    setEditingClass(classroom)
  }

  const handleEditSubmit = async (formData) => {
    if (!editingClass || !currentUserId) return

    try {
      setUpdating(true)
      setEditError(null)

      const payload = {
        name: formData.name,
        code: formData.code,
        subjectId: Number(formData.subjectId),
        teacherId: Number(currentUserId),
        academicYear:
          editingClass.academicYear || getCurrentAcademicYear(),
        description: formData.description || '',
      }

      const updatedClass = await classroomService.update(
        editingClass.id,
        payload,
      )

      setClasses((prev) =>
        prev.map((item) =>
          item.id === editingClass.id
            ? { ...item, ...updatedClass }
            : item,
        ),
      )

      setEditingClass(null)
      setToast({
        type: 'success',
        message: 'Cập nhật lớp học thành công.',
      })
    } catch (error) {
      console.error('Update class error:', error)

      const backendMessage = getErrorMessage(error.response?.data)

      setEditError(
        backendMessage ||
          `Không thể cập nhật lớp học (HTTP ${
            error.response?.status || 'unknown'
          }).`,
      )
    } finally {
      setUpdating(false)
    }
  }

  const handleArchive = (classroom) => {
    setConfirmAction({
      type: 'archive',
      classroom,
    })
  }

  const handleDelete = (classroom) => {
    setConfirmAction({
      type: 'delete',
      classroom,
    })
  }

  const handleView = (classroom) => {
    navigate(`/teacher/classes/${classroom.id}`)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    const { type, classroom } = confirmAction

    try {
      setActionLoading(true)

      if (type === 'archive') {
        const archivedClass = await classroomService.archive(classroom.id)

        setClasses((prev) =>
          prev.map((item) =>
            item.id === classroom.id
              ? { ...item, ...archivedClass }
              : item,
          ),
        )

        setToast({
          type: 'success',
          message: 'Vô hiệu hóa lớp học thành công.',
        })
      }

      if (type === 'delete') {
        await classroomService.delete(classroom.id)

        setClasses((prev) =>
          prev.filter((item) => item.id !== classroom.id),
        )

        setToast({
          type: 'success',
          message: 'Xóa lớp học thành công.',
        })
      }

      setConfirmAction(null)
    } catch (error) {
      console.error('Classroom action error:', error)

      const backendMessage = getErrorMessage(error.response?.data)

      setToast({
        type: 'error',
        message:
          backendMessage ||
          'Không thể thực hiện thao tác. Vui lòng thử lại.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <DashboardLayout>
      {toast && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-[60] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border px-4 py-3 shadow-lg sm:right-6 sm:top-6 ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            type="button"
            aria-label="Đóng thông báo"
            onClick={() => setToast(null)}
            className="-mr-1 -mt-1 rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page heading */}
      <div className="flex flex-col justify-between gap-5 border-b border-emerald-100 pb-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <School size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#18301D]">
                Lớp học
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Quản lý các lớp học bạn đang phụ trách
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError(null)
            setIsCreateModalOpen(true)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-800 sm:w-auto"
        >
          <Plus size={18} />
          Tạo lớp
        </button>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <div>
            <p className="text-sm font-medium text-slate-500">Tổng số lớp</p>
            <p className="mt-2 text-3xl font-bold text-[#18301D]">
              {totalClasses}
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <School size={21} />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Đang hoạt động
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {activeClasses}
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={21} />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <div>
            <p className="text-sm font-medium text-slate-500">Đã vô hiệu</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              {archivedClasses}
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Archive size={21} />
          </span>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm kiếm theo tên hoặc mã lớp..."
            className="w-full rounded-xl border border-emerald-100 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Lọc trạng thái lớp"
        >
          {statusFilters.map((filter) => {
            const isSelected = selectedStatus === filter.value

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedStatus(filter.value)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                  isSelected
                    ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                    : 'border-emerald-100 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {filter.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs ${
                    isSelected
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Result information */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500" aria-live="polite">
          Hiển thị{' '}
          <span className="font-semibold text-[#18301D]">
            {filteredClasses.length}
          </span>{' '}
          / {totalClasses} lớp
        </p>
      </div>

      {/* Classes */}
      {loading ? (
        <div className="mt-4 flex min-h-80 items-center justify-center rounded-2xl border border-green-100 bg-white text-sm text-gray-400">
          Đang tải danh sách lớp học...
        </div>
      ) : error ? (
        <div className="mt-4 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-6 text-center">
          <h3 className="font-semibold text-red-600">{error}</h3>

          <p className="mt-1 text-sm text-gray-400">
            Vui lòng thử lại sau.
          </p>
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredClasses.map((classroom) => (
            <ClassCard
              key={classroom.id}
              classroom={classroom}
              onView={handleView}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-green-200 bg-white">
          <School size={42} className="text-green-200" />

          <h3 className="mt-4 font-semibold text-gray-700">
            Không tìm thấy lớp học
          </h3>

          <p className="mt-1 text-sm text-gray-400">
            Thử thay đổi từ khóa tìm kiếm.
          </p>
        </div>
      )}
      <ClassFormModal
        isOpen={isCreateModalOpen}
        error={createError}
        onClearError={() => setCreateError(null)}
        onClose={() => {
          if (!creating) {
            setIsCreateModalOpen(false)
            setCreateError(null)
          }
        }}
        onSubmit={handleCreateSubmit}
        submitting={creating}
      />

      <ClassFormModal
        isOpen={!!editingClass}
        initialData={editingClass}
        mode="edit"
        error={editError}
        onClearError={() => setEditError(null)}
        submitting={updating}
        onClose={() => {
          if (!updating) {
            setEditingClass(null)
            setEditError(null)
          }
        }}
        onSubmit={handleEditSubmit}
      />

      <ConfirmModal
        open={!!confirmAction}
        loading={actionLoading}
        danger={confirmAction?.type === 'delete'}
        title={
          confirmAction?.type === 'archive'
            ? 'Vô hiệu lớp học'
            : 'Xóa lớp học'
        }
        description={
          confirmAction?.type === 'archive'
            ? `Bạn có chắc chắn muốn vô hiệu lớp "${confirmAction?.classroom?.name}" không?`
            : `Bạn có chắc chắn muốn xóa vĩnh viễn lớp "${confirmAction?.classroom?.name}" không? Hành động này không thể hoàn tác.`
        }
        confirmText={
          confirmAction?.type === 'archive' ? 'Vô hiệu' : 'Xóa lớp'
        }
        onClose={() => {
          if (!actionLoading) {
            setConfirmAction(null)
          }
        }}
        onConfirm={handleConfirmAction}
      />

    </DashboardLayout>
  )
}

export default ClassListPage