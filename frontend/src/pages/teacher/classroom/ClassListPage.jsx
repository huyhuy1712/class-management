import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpDown,
  Plus,
  Search,
  School,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import DashboardLayout from '../../../layouts/DashboardLayout'
import ClassCard from '../../../components/classroom/ClassCard'
import ClassFormModal from '../../../components/classroom/ClassFormModal'
import classroomService from '../../../services/classroomService'
import { CURRENT_USER } from '../../../utils/constants'

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

  const [classes, setClasses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)

  const [isCreateModalOpen, setIsCreateModalOpen] =
  useState(false)

    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await classroomService.getAll()
        const teacherClasses = data.filter(
          (classroom) => classroom.teacherId === CURRENT_USER.id,
        )

        setClasses(teacherClasses)
      } catch (fetchError) {
        console.error('Get classes error:', fetchError)
        setError('Không thể tải danh sách lớp học.')
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  const filteredClasses = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return classes

    return classes.filter(
      (item) =>
        String(item.name ?? '').toLowerCase().includes(keyword) ||
        String(item.code ?? '').toLowerCase().includes(keyword) ||
        String(item.subject ?? '').toLowerCase().includes(keyword),
    )
  }, [classes, search])

  
  const handleCreateSubmit = async (formData) => {
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
        teacherId: CURRENT_USER.id,
        academicYear: getCurrentAcademicYear(),
        description: formData.description,
        }

        console.log('Create class payload:', payload)

        const createdClass = await classroomService.create(payload)

        console.log('Created class:', createdClass)

        setClasses((prev) => [
        {
          ...createdClass,
          academicYear: createdClass.academicYear || payload.academicYear,
        },
        ...prev,
        ])

        setIsCreateModalOpen(false)
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
    setEditingClass(classroom)
    setModalOpen(true)
  }

  const handleSubmit = (form) => {
    if (editingClass) {
      setClasses((prev) =>
        prev.map((item) =>
          item.id === editingClass.id
            ? { ...item, ...form }
            : item,
        ),
      )
    } else {
      const newClass = {
        id: Date.now(),
        ...form,
        studentCount: 0,
      }

      setClasses((prev) => [newClass, ...prev])
    }

    setModalOpen(false)
    setEditingClass(null)
  }

  const handleDelete = (classroom) => {
    const accepted = window.confirm(
      `Bạn có chắc muốn xóa lớp "${classroom.name}"?`,
    )

    if (!accepted) return

    setClasses((prev) =>
      prev.filter((item) => item.id !== classroom.id),
    )
  }

  const handleView = (classroom) => {
    navigate(`/teacher/classes/${classroom.id}`)
  }

  return (
    <DashboardLayout>
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <School size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#18301D]">
                Lớp học
              </h1>

              <p className="mt-1 text-sm text-gray-400">
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
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          <Plus size={18} />
          Tạo lớp
        </button>
      </div>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row">
        {/* Search */}
        <div className="relative flex-1">
            <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm kiếm theo tên hoặc mã lớp..."
            className="w-full rounded-xl border border-green-100 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
            />
        </div>

        {/* Sort */}
        <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-white px-5 py-3 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-green-300 hover:text-green-700"
        >
            <ArrowUpDown size={17} />
            Sắp xếp theo tên
        </button>
        </div>

      {/* Result information */}
      <div className="mt-7 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-[#18301D]">
            {filteredClasses.length}
          </span>{' '}
          lớp học
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
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">          {filteredClasses.map((classroom) => (
            <ClassCard
              key={classroom.id}
              classroom={classroom}
              onView={handleView}
              onEdit={handleEdit}
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
    onClose={() => {
        if (!creating) {
        setIsCreateModalOpen(false)
        setCreateError(null)
        }
    }}
    onSubmit={handleCreateSubmit}
    submitting={creating}
    />
      
    </DashboardLayout>
  )
}

export default ClassListPage