import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'

import DashboardLayout from '../../../layouts/DashboardLayout'
import ClassDetailHeader from '../../../components/classroom/detail/ClassDetailHeader'
import ClassDetailSidebar from '../../../components/classroom/detail/ClassDetailSidebar'
import classroomService from '../../../services/classroomService'

function ClassDetailPage() {
  const { classId } = useParams()

  const [classroom, setClassroom] = useState(null)
  const [studentCount, setStudentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setLoading(true)
        setError(null)

        const classes = await classroomService.getAll()

        const foundClass = classes.find(
          (item) => Number(item.id) === Number(classId),
        )

        if (!foundClass) {
          setError('Không tìm thấy lớp học.')
          return
        }

        const students = await classroomService.getStudents(foundClass.id)

        setClassroom(foundClass)
        setStudentCount(students.length)
      } catch (error) {
        console.error('Get classroom detail error:', error)
        setError('Không thể tải thông tin lớp học.')
      } finally {
        setLoading(false)
      }
    }

    fetchClassroom()
  }, [classId])

  const handleActivate = () => {
  console.log('Activate classroom:', classroom?.id)
  }

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-green-100 bg-white text-sm text-gray-400">
          Đang tải thông tin lớp học...
        </div>
      ) : error ? (
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-red-100 bg-white text-sm text-red-500">
          {error}
        </div>
      ) : (
        <>
          <ClassDetailHeader
            classroom={classroom}
            onActivate={handleActivate}
            studentCount={studentCount}
          />

          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            <ClassDetailSidebar studentCount={studentCount} />

            <main className="min-w-0 flex-1">
              <Outlet
                context={{
                  classroom,
                  onStudentCountChange: setStudentCount,
                }}
              />
            </main>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

export default ClassDetailPage