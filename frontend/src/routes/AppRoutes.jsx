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
import ExamDetailPage from '../pages/teacher/exams/ExamDetailPage'
import CreateExamPage from '../pages/teacher/exams/create/CreateExamPage'
import ExamBuilderPage from '../pages/teacher/exams/builder/ExamBuilderPage'

// =============================
// Student
// =============================
import StudentHome from '../pages/student/StudentHome'
import StudentAttendancePage from '../pages/student/StudentAttendancePage'
import JoinClassPage from '../pages/student/JoinClassPage' 

function AppRoutes() {
  return (
    <Routes>
      {/* Route mặc định */}
      <Route path="/" element={<Navigate to="/login" replace />} />

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
      <Route path="/student" element={<StudentHome />} />
      <Route path="/student/attendance" element={<StudentAttendancePage />} />
      <Route path="/student/classes" element={<JoinClassPage />} />

      {/* Route exam management */}
      <Route path="/teacher/exams" element={<ExamManagementPage />} />
      <Route path="/teacher/exams/:examId" element={<ExamDetailPage />} />
      <Route path="/teacher/exams/create" element={<CreateExamPage />} />
      <Route path="/teacher/exams/create/online" element={<ExamBuilderPage />} />
    </Routes>
  )
}

export default AppRoutes