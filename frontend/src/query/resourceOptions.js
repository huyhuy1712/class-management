import classroomService from '../services/classroomService'
import userService from '../services/userService'
import attendanceService from '../services/attendanceService'
import lessonService from '../services/lessonService'
import notificationService from '../services/notificationService'
import requestService from '../services/requestService'
import examService from '../services/examService'
import subjectService from '../services/subjectService'

export function resourceOptions(resource, params) {
  const readers = {
    profile: ({ signal }) => userService.getProfile(params[0], { signal }),
    teacherClasses: ({ signal }) => classroomService.getMyClasses({ signal }),
    studentClasses: ({ signal }) => userService.getMyClasses({ signal }),
    allClasses: ({ signal }) => classroomService.getAll({ signal }),
    classStudents: ({ signal }) => classroomService.getStudents(params[0], { signal }),
    teachers: ({ signal }) => userService.getTeachers({ signal }),
    studentDirectory: ({ signal }) => userService.getStudents({ signal }),
    teacherStudents: ({ signal }) => userService.getMyStudents({ signal }),
    dashboard: ({ signal }) => userService.getMyStudentDashboard({ signal }),
    examCount: ({ signal }) => userService.getMyCompletedExamCount({ signal }),
    attendances: ({ signal }) => attendanceService.getByClass(params[0], { signal }),
    lessons: ({ signal }) => lessonService.getByDate(params[0], params[1], { signal }),
    notifications: async ({ signal }) => {
      const items = await notificationService.getMyNotifications({ signal })
      if (!Array.isArray(items)) throw new Error('Invalid notifications response')
      return items.map((item) => ({ ...item, read: item.read ?? item.is_read ?? false }))
    },
    requests: ({ signal }) => requestService.getReceivedJoinClassRequests({ signal }),
    exams: ({ signal }) => examService.getMyExams({ signal }),
    examDetail: ({ signal }) => examService.getExamDetail(params[0], { signal }),
    examConfiguration: ({ signal }) => examService.getExamConfiguration(params[0], { signal }),
    subjects: ({ signal }) => subjectService.getAll({ signal }),
  }
  if (!readers[resource]) throw new Error(`Unknown query resource: ${resource}`)
  const realtime = ['notifications', 'requests', 'lessons'].includes(resource)
  return { queryFn: readers[resource], staleTime: realtime ? 15_000 : resource === 'subjects' ? 30 * 60_000 : 60_000, ...(realtime ? { refetchInterval: 60_000 } : {}) }
}
