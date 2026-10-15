import { lazy, Suspense } from 'react'
import FrogLoading from '../utils/FrogLoading'
import StudentExamListPage from '../pages/student/exams/StudentExamListPage'
import StudentExamWaitingPage from '../pages/student/exams/StudentExamWaitingPage'
const StudentExamPaperPreviewPage = lazy(() => import('../pages/student/exams/StudentExamPaperPreviewPage'))
const StudentExamAttemptPage = lazy(() => import('../pages/student/exams/StudentExamAttemptPage'))
const StudentExamResultPage = lazy(() => import('../pages/student/exams/StudentExamResultPage'))
const StudentGradesPage = lazy(() => import('../pages/student/grades/StudentGradesPage'))
import { Navigate, Route, Routes } from 'react-router-dom'

import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import ClassListPage from '../pages/teacher/classroom/ClassroomListPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import ClassDetailPage from '../pages/teacher/classroom/ClassroomDetailPage'
import StudentsTab from '../pages/teacher/classroom/tabs/StudentsTab'
import AssignmentsTab from '../pages/teacher/classroom/tabs/AssignmentsTab'
import AnnouncementsTab from '../pages/teacher/classroom/tabs/AnnouncementsTab'
import GradesTab from '../pages/teacher/classroom/tabs/GradesTab'
import AttendanceTab from '../pages/teacher/classroom/tabs/AttendanceTab'
import StudentDetailPage from '../pages/teacher/classroom/StudentDetailPage'
import TeacherProfilePage from '../pages/teacher/TeacherProfilePage'
import ExamManagementPage from '../pages/teacher/exams/ExamManagementPage'
const ExamDetailPage = lazy(() => import('../pages/teacher/exams/ExamDetailPage'))
const TeacherAssignmentDetailPage = lazy(() => import('../pages/teacher/exams/TeacherAssignmentDetailPage'))
const TeacherAttemptReviewPage = lazy(() => import('../pages/teacher/exams/TeacherAttemptReviewPage'))
import CreateExamPage from '../pages/teacher/exams/create/CreateExamPage'
const ExamBuilderPage = lazy(() => import('../pages/teacher/exams/builder/ExamBuilderPage'))

// =============================
// Student
// =============================
import StudentProfilePage from '../pages/student/StudentProfilePage'
import StudentHome from '../pages/student/StudentHome'
import StudentAttendancePage from '../pages/student/StudentAttendancePage'
import JoinClassPage from '../pages/student/JoinClassPage' 
import StudentClassDetailPage from '../pages/student/classroom/StudentClassDetailPage'

// =============================
// Landing Page (Public)
// =============================
import LandingPage from '../pages/landing'

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

      {/* Route teacher */}
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/classes" element={<ClassListPage />} />
      <Route path="/teacher/profile" element={<TeacherProfilePage />} />

      {/* Nested Route classDetail */}
      <Route path="/teacher/classes/:classId" element={<ClassDetailPage />}>
        <Route index element={<StudentsTab />} />
        <Route path="assignments" element={<AssignmentsTab />} />
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
      <Route path="/student/grades" element={<StudentGradesPage />} />
      <Route path="/student/exams/preview/paper" element={<StudentExamPaperPreviewPage />} />
      <Route path="/student/exams/:assignmentId" element={<StudentExamWaitingPage />} />
      <Route path="/student/exam-attempts/:attemptId" element={<StudentExamAttemptPage />} />
      <Route path="/student/exam-attempts/:attemptId/result" element={<StudentExamResultPage />} />
      <Route path="/student/teachers" element={<JoinClassPage />} />

      {/* Route exam management */}
      <Route path="/teacher/exams" element={<ExamManagementPage />} />
      <Route path="/teacher/exams/:examId" element={<ExamDetailPage />} />
      <Route path="/teacher/exams/:examId/assignments/:assignmentId" element={<TeacherAssignmentDetailPage />} />
      <Route path="/teacher/exams/:examId/assignments/:assignmentId/attempts/:attemptId" element={<TeacherAttemptReviewPage />} />
      <Route path="/teacher/exams/create" element={<CreateExamPage />} />
      <Route path="/teacher/exams/create/online" element={<ExamBuilderPage />} />
    </Routes>
    </Suspense>
  )
}

export default AppRoutes
