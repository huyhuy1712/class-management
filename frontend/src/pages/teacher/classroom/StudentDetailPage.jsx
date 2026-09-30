import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

function StudentDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { classId, studentId } = useParams()

  // Student được truyền từ StudentsTab qua navigate()
  const student = location.state?.student

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() =>
          navigate(`/teacher/classes/${classId}`)
        }
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-green-700"
      >
        <ArrowLeft size={18} />
        Quay lại danh sách học sinh
      </button>

      {/* Student header */}
      <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-xl font-bold text-green-700">
              {student?.fullName
                ?.split(' ')
                .map((item) => item[0])
                .slice(-2)
                .join('')
                .toUpperCase() || 'HS'}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                Học sinh
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#18301D]">
                {student?.fullName || `Học sinh #${studentId}`}
              </h1>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400">
                <span>
                  Mã HS: {student?.studentCode || '---'}
                </span>

                <span>
                  @{student?.username || '---'}
                </span>
              </div>
            </div>
          </div>

          <span className="w-fit rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            Đang học
          </span>
        </div>

        {/* Contact */}
        {student && (
          <div className="mt-6 grid gap-3 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-[#F7FAF7] p-4">
              <Mail size={18} className="text-green-600" />

              <div className="min-w-0">
                <p className="text-xs text-gray-400">Email</p>
                <p className="mt-1 truncate text-sm font-medium text-gray-700">
                  {student.email || 'Chưa cập nhật'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-[#F7FAF7] p-4">
              <Phone size={18} className="text-green-600" />

              <div>
                <p className="text-xs text-gray-400">Số điện thoại</p>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {student.phone || 'Chưa cập nhật'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-[#F7FAF7] p-4">
              <UserRound size={18} className="text-green-600" />

              <div>
                <p className="text-xs text-gray-400">ID học sinh</p>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {studentId}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Placeholder */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <BookOpenCheck size={19} />
            </div>

            <div>
              <h2 className="font-bold text-[#18301D]">
                Kết quả học tập
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Bài tập và đề thi của học sinh
              </p>
            </div>
          </div>

          <div className="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-green-200 bg-[#F9FCF8]">
            <p className="text-sm text-gray-400">
              Sẽ kết nối API ở bước sau
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <BarChart3 size={19} />
            </div>

            <div>
              <h2 className="font-bold text-[#18301D]">
                Tổng quan điểm số
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Thống kê kết quả của học sinh
              </p>
            </div>
          </div>

          <div className="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-green-200 bg-[#F9FCF8]">
            <p className="text-sm text-gray-400">
              Sẽ kết nối API ở bước sau
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default StudentDetailPage