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

// =============================
// Student
// =============================
import StudentHome from '../pages/student/StudentHome'
import AttendancePage from '../pages/student/StudentAttendancePage'
import JoinClassPage from '../pages/student/JoinClassPage'


function AppRoutes() {
  return (
    <Routes>

      {/* Route mặc định */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* =========================
          Route Auth
      ========================= */}
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/signup"
        element={<SignupPage />}
      />


      {/* =========================
          Route Teacher
      ========================= */}

      <Route
        path="/teacher"
        element={<TeacherDashboard />}
      />

      <Route
        path="/teacher/classes"
        element={<ClassListPage />}
      />

      <Route
        path="/teacher/profile"
        element={<TeacherProfilePage />}
      />


      {/* =========================
          Nested Route Class Detail
      ========================= */}

      <Route
        path="/teacher/classes/:classId"
        element={<ClassDetailPage />}
      >

        <Route
          index
          element={<StudentsTab />}
        />

        <Route
          path="assignments"
          element={<AssignmentsTab />}
        />

        <Route
          path="announcements"
          element={<AnnouncementsTab />}
        />

        <Route
          path="grades"
          element={<GradesTab />}
        />

        <Route
          path="attendance"
          element={<AttendanceTab />}
        />

        {/* Student Detail */}
        <Route
          path="students/:studentId"
          element={<StudentDetailPage />}
        />

      </Route>


      {/* =========================
          Route Student
      ========================= */}

      <Route
        path="/student"
        element={<StudentHome />}
      />
      <Route
        path="/student/attendance"
        element={<AttendancePage />}
      />
      <Route
        path="/student/classes"
        element={<JoinClassPage />}
      />

    </Routes>
  )
}

export default AppRoutes