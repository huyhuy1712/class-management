import classroomService from '../services/classroomService'
import userService from '../services/userService'
import attendanceService from '../services/attendanceService'
import lessonService from '../services/lessonService'
import notificationService from '../services/notificationService'
import requestService from '../services/requestService'
import examService from '../services/examService'
import subjectService from '../services/subjectService'
import materialService from '../services/materialService'
import billingService from '../services/billingService'
import homeworkService from '../services/homeworkService'

export function resourceOptions(resource, params) {
  const readers = {
    pdfExamImport: ({ signal }) => examService.getPdfImport(params[0], { signal }),
    pdfExamImportAsset: ({ signal }) => examService.getPdfImportAsset(params[0], params[1], { signal }),
    classGradebook: ({ signal }) => classroomService.getGradebook(params[0], { page: Number(params[1] ?? 0), size: 20, q: params[2] ?? '', ...(params[3] ? { subjectId: Number(params[3]) } : {}) }, { signal }),
    profile: ({ signal }) => userService.getProfile(params[0], { signal }),
    teacherClasses: ({ signal }) => classroomService.getMyClasses({ signal }),
    studentClasses: ({ signal }) => userService.getMyClasses({ signal }),
    allClasses: ({ signal }) => classroomService.getAll({ signal }),
    classStudents: ({ signal }) => classroomService.getStudents(params[0], { signal }),
    classDocuments: ({ signal }) => classroomService.getDocuments(params[0], { signal }),
    classFeedPosts: ({ signal }) => classroomService.getFeedPosts(
      params[0],
      Number(params[1] ?? 0),
      Number(params[2] ?? 20),
      { signal },
    ),
    classFeedComments: ({ signal }) => classroomService.getFeedComments(
      params[0],
      params[1],
      Number(params[2] ?? 0),
      Number(params[3] ?? 20),
      { signal },
    ),
    teacherMaterials: ({ signal }) => materialService.getTeacherMaterials({ signal }),
    teacherHomeworks: ({ signal }) => homeworkService.getTeacherList(params[0], { signal }),
    teacherHomework: ({ signal }) => homeworkService.getTeacherDetail(params[0], { signal }),
    homeworkSubmissions: ({ signal }) => homeworkService.getSubmissions(params[0], params[1], { signal }),
    studentHomeworkSummary: ({ signal }) => homeworkService.getStudentClassSummary(params[0], params[1], { signal }),
    classHomeworks: ({ signal }) => homeworkService.getTeacherList(params[0], { signal }),
    studentHomeworks: ({ signal }) => homeworkService.getStudentList({
      signal,
      ...(params[0] ? { params: { classId: params[0] } } : {}),
    }),
    studentHomework: ({ signal }) => homeworkService.getStudentDetail(params[0], { signal }),
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
    studentGrades: ({ signal }) => examService.getMyGrades({
      ...(params[0] ? { classId: Number(params[0]) } : {}), ...(params[1] ? { subjectId: Number(params[1]) } : {}),
      ...(params[2] ? { from: params[2] } : {}), ...(params[3] ? { to: params[3] } : {}),
      q: params[4] ?? '', ...(params[5] ? { status: params[5] } : {}), sort: params[6] ?? 'newest',
      page: Number(params[7] ?? 0), size: 6, includeCharts: true,
    }, { signal }),
    teacherAssignmentExport: ({ signal }) => examService.getAssignmentExport(params[0], params[1], { signal }),
    teacherAttemptReview: ({ signal }) => examService.getTeacherAttemptReview(params[0], { signal }),
    studentClassExamResults: ({ signal }) => examService.getStudentClassExamResults(params[0], params[1], { signal }),
    classExams: ({ signal }) => examService.getClassExams(params[0], { signal }),
    teacherAssignmentAttempts: ({ signal }) => examService.getAssignmentAttempts(params[0], {
      ...(params[1] ? { classId: Number(params[1]) } : {}), page: Number(params[2] ?? 0), size: Number(params[3] ?? 12),
      q: params[4] ?? '', ...(params[5] ? { status: params[5] } : {}), sort: params[6] ?? 'newest',
    }, { signal }),
    examDetail: ({ signal }) => examService.getExamDetail(params[0], { signal }),
    examConfiguration: ({ signal }) => examService.getExamConfiguration(params[0], { signal }),
    subjects: ({ signal }) => subjectService.getAll({ signal }),
    studentExams: ({ signal }) => examService.getStudentExams({
      signal,
      ...(params[0] === 'CLASS' ? { params: { classId: params[1] } } : {}),
    }, params[0] === 'OLDEST' ? 'oldest' : 'newest'),
    studentAssignment: ({ signal }) => examService.getStudentAssignment(params[0], { signal }),
    examAttempt: ({ signal }) => examService.getAttempt(params[0], { signal }),
    examAttemptResult: ({ signal }) => examService.getAttemptResult(params[0], { signal }),
    billing: ({ signal }) => billingService.getOverview({ signal }),
    billingOrder: ({ signal }) => billingService.getOrder(params[0], { signal }),
  }
  if (!readers[resource]) throw new Error(`Unknown query resource: ${resource}`)
  const classroomMembership = ['studentClasses', 'classStudents'].includes(resource)
  const realtime = ['notifications', 'requests', 'lessons', 'studentExams', 'studentAssignment', 'classExams', 'teacherAssignmentAttempts', 'teacherHomeworks', 'teacherHomework', 'homeworkSubmissions', 'classHomeworks', 'studentHomeworks', 'studentHomework'].includes(resource)
  return {
    queryFn: readers[resource],
    staleTime: classroomMembership ? 10_000 : realtime || resource === 'billing' || resource === 'classFeedPosts' ? 15_000 : resource === 'teacherMaterials' ? 15_000 : resource === 'subjects' ? 30 * 60_000 : 60_000,
    ...(classroomMembership
      ? { refetchInterval: 10_000 }
      : realtime ? { refetchInterval: 60_000 } : resource === 'billing' ? { refetchInterval: 60_000 } : resource === 'billingOrder'
        ? { refetchInterval: (query) => ['PENDING', 'CREATING'].includes(query.state.data?.status) ? 10_000 : false }
        : {}),
  }
}
