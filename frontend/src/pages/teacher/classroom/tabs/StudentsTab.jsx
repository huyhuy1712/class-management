import { Plus, Search, Users, FileSpreadsheet } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useState } from 'react'

import AddStudentModal from '../../../../components/classroom/detail/AddStudentModal'
import classroomService from '../../../../services/classroomService'

function StudentsTab() {
  const { classroom } = useOutletContext()

  const [students, setStudents] = useState([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  const getErrorMessage = (data) => {
  if (!data) return ''

  if (typeof data === 'string') {
    return data
  }
  return data.message || data.error || ''
}


const handleAddStudent = async (studentId) => {
  try {
    setAdding(true)
    setAddError(null)

    const student = await classroomService.addStudent(
      classroom.id,
      studentId,
    )

    setStudents((prev) => [student, ...prev])

    setAddModalOpen(false)
  } catch (error) {
    console.error('Add student error:', error)

    const status = error.response?.status
    const backendMessage = getErrorMessage(error.response?.data)

    if (status === 403) {
      setAddError(
        backendMessage ||
          'Học sinh này đã có trong lớp học.',
      )
      return
    }

    if (status === 400) {
      setAddError(
        backendMessage ||
          'Không tìm thấy học sinh hoặc tài khoản học sinh không hợp lệ.',
      )
      return
    }

    setAddError(
      backendMessage ||
        'Không thể thêm học sinh. Vui lòng thử lại.',
    )
  } finally {
    setAdding(false)
  }
}

  return (
    <>
    <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-xl font-bold text-[#18301D]">
          Danh sách học sinh
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          Quản lý học sinh trong {classroom.name}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            // TODO: Import Excel/CSV sau
            console.log('Import students')
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
        >
          <FileSpreadsheet size={18} />
          Nhập từ file
        </button>

        <button
          type="button"
            onClick={() => {
            setAddError(null)
            setAddModalOpen(true)
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          <Plus size={18} />
          Thêm học sinh
        </button>
      </div>
    </div>

      <div className="relative mt-6">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Tìm kiếm học sinh..."
          className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
        />
      </div>

      <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-green-200 bg-[#F9FCF8]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Users size={22} />
        </div>

        <h3 className="mt-3 font-semibold text-[#18301D]">
          Danh sách học sinh
        </h3>

        <p className="mt-1 text-sm text-gray-400">
          API học sinh sẽ được kết nối ở bước tiếp theo.
        </p>
      </div>
    </section>

        <AddStudentModal
      open={addModalOpen}
      loading={adding}
      error={addError}
      onClose={() => {
        if (!adding) {
          setAddModalOpen(false)
          setAddError(null)
        }
      }}
      onSubmit={handleAddStudent}
    />
  </>
  )
}

export default StudentsTab