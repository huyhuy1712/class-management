import { lazy, Suspense } from 'react'
import FrogLoading from '../utils/FrogLoading'
import StudentExamListPage from '../pages/student/exams/StudentExamListPage'
import StudentExamWaitingPage from '../pages/student/exams/StudentExamWaitingPage'
const StudentExamPaperPreviewPage = lazy(() => import('../pages/student/exams/StudentExamPaperPreviewPage'))
const StudentExamAttemptPage = lazy(() => import('../pages/student/exams/StudentExamAttemptPage'))
const StudentExamResultPage = lazy(() => import('../pages/student/exams/StudentExamResultPage'))
const StudentHomeworkPage = lazy(() => import('../pages/student/homework/StudentHomeworkPage'))
const StudentHomeworkDetailPage = lazy(() => import('../pages/student/homework/StudentHomeworkDetailPage'))
const StudentGradesPage = lazy(() => import('../pages/student/grades/StudentGradesPage'))
import { Navigate, Route, Routes } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import ClassListPage from '../pages/teacher/classroom/ClassroomListPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import GoogleOAuthCallbackPage from '../pages/auth/GoogleOAuthCallbackPage'
import ClassDetailPage from '../pages/teacher/classroom/ClassroomDetailPage'
import StudentsTab from '../pages/teacher/classroom/tabs/StudentsTab'
import AssignmentsTab from '../pages/teacher/classroom/tabs/AssignmentsTab'
import AnnouncementsTab from '../pages/teacher/classroom/tabs/AnnouncementsTab'
import GradesTab from '../pages/teacher/classroom/tabs/GradesTab'
import AttendanceTab from '../pages/teacher/classroom/tabs/AttendanceTab'
import ClassHomeworkTab from '../pages/teacher/classroom/tabs/ClassHomeworkTab'
import ClassDocumentsTab from '../components/classroom/detail/ClassDocumentsTab'
import StudentDetailPage from '../pages/teacher/classroom/StudentDetailPage'
import TeacherProfilePage from '../pages/teacher/TeacherProfilePage'
import TeacherMaterialsPage from '../pages/teacher/materials/TeacherMaterialsPage'
import ExamManagementPage from '../pages/teacher/exams/ExamManagementPage'
const ExamDetailPage = lazy(() => import('../pages/teacher/exams/ExamDetailPage'))
const TeacherAssignmentDetailPage = lazy(() => import('../pages/teacher/exams/TeacherAssignmentDetailPage'))
const TeacherAttemptReviewPage = lazy(() => import('../pages/teacher/exams/TeacherAttemptReviewPage'))
import CreateExamPage from '../pages/teacher/exams/create/CreateExamPage'
const ExamBuilderPage = lazy(() => import('../pages/teacher/exams/builder/ExamBuilderPage'))
const TeacherBillingPage = lazy(() => import('../pages/teacher/billing/TeacherBillingPage'))
const TeacherHomeworkPage = lazy(() => import('../pages/teacher/homework/TeacherHomeworkPage'))
const CreateTeacherHomeworkPage = lazy(() => import('../pages/teacher/homework/CreateTeacherHomeworkPage'))
const TeacherHomeworkDetailPage = lazy(() => import('../pages/teacher/homework/TeacherHomeworkDetailPage'))

// =============================
// Student
// =============================
import StudentProfilePage from '../pages/student/StudentProfilePage'
import StudentHome from '../pages/student/StudentHome'
import StudentAttendancePage from '../pages/student/StudentAttendancePage'
import JoinClassPage from '../pages/student/JoinClassPage' 
import StudentClassDetailPage from '../pages/student/classroom/StudentClassDetailPage'

// =============================
// Admin
// =============================

import AdminDashboardLayout from "../layouts/AdminDashboardLayout";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import UserManagementPage from "../pages/admin/UserManagementPage";
import SubjectManagementPage from "../pages/admin/SubjectManagementPage";


// =============================
// Landing Page (Public)
// =============================
import LandingPage from '../pages/landing'

function AdminRoute({ children }) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to={user.role === 'TEACHER' ? '/teacher' : '/student'} replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<FrogLoading label="Đang mở trang..." />}>
    <Routes>
      {/* Landing Page — Public, không cần đăng nhập */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />

      {/* Route Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/oauth/callback" element={<GoogleOAuthCallbackPage />} />

      {/* Route teacher */}
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/classes" element={<ClassListPage />} />
      <Route path="/teacher/profile" element={<TeacherProfilePage />} />
      <Route path="/teacher/billing" element={<TeacherBillingPage />} />
      <Route path="/teacher/materials" element={<TeacherMaterialsPage />} />

      {/* Nested Route classDetail */}
      <Route path="/teacher/classes/:classId" element={<ClassDetailPage />}>
        <Route index element={<StudentsTab />} />
        <Route path="assignments" element={<AssignmentsTab />} />
        <Route path="homework" element={<ClassHomeworkTab />} />
        <Route path="materials" element={<ClassDocumentsTab />} />
        <Route path="announcements" element={<AnnouncementsTab />} />
        <Route path="grades" element={<GradesTab />} />
        <Route path="attendance" element={<AttendanceTab />} />
        <Route path="students/:studentId" element={<StudentDetailPage />} />
      </Route> {/* <--- Đóng đúng vị trí cho Nested Route teacher class detail */}

      {/* =========================
          Route Student
      ========================= */}
      <Route path="/student/profile" element={<StudentProfilePage />} />
      <Route path="/student" element={<StudentHome />} />
      <Route path="/student/attendance" element={<StudentAttendancePage />} />
      <Route path="/student/classes" element={<JoinClassPage />} />
      <Route path="/student/classes/:classId" element={<StudentClassDetailPage />} />
      <Route path="/student/exams" element={<StudentExamListPage />} />
      <Route path="/student/homework" element={<StudentHomeworkPage />} />
      <Route path="/student/homework/:homeworkId" element={<StudentHomeworkDetailPage />} />
      <Route path="/student/grades" element={<StudentGradesPage />} />
      <Route path="/student/exams/preview/paper" element={<StudentExamPaperPreviewPage />} />
      <Route path="/student/exams/:assignmentId" element={<StudentExamWaitingPage />} />
      <Route path="/student/exam-attempts/:attemptId" element={<StudentExamAttemptPage />} />
      <Route path="/student/exam-attempts/:attemptId/result" element={<StudentExamResultPage />} />
      <Route path="/student/teachers" element={<JoinClassPage />} />

      {/* Route exam management */}
      <Route path="/teacher/exams" element={<ExamManagementPage />} />
      <Route path="/teacher/homework" element={<TeacherHomeworkPage />} />
      <Route path="/teacher/homework/create" element={<CreateTeacherHomeworkPage />} />
      <Route path="/teacher/homework/:homeworkId/edit" element={<CreateTeacherHomeworkPage />} />
      <Route path="/teacher/homework/:homeworkId" element={<TeacherHomeworkDetailPage />} />
      <Route path="/teacher/homework/:homeworkId/submissions/:studentId" element={<TeacherHomeworkDetailPage />} />
      <Route path="/teacher/exams/:examId" element={<ExamDetailPage />} />
      <Route path="/teacher/exams/:examId/assignments/:assignmentId" element={<TeacherAssignmentDetailPage />} />
      <Route path="/teacher/exams/:examId/assignments/:assignmentId/attempts/:attemptId" element={<TeacherAttemptReviewPage />} />
      <Route path="/teacher/exams/create" element={<CreateExamPage />} />
      <Route path="/teacher/exams/create/online" element={<ExamBuilderPage />} />

                {/* =========================
                        Route Admin
                    ========================= */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="subjects" element={<SubjectManagementPage />} />
      </Route>



    </Routes>
    </Suspense>
  )
}

export default AppRoutes
