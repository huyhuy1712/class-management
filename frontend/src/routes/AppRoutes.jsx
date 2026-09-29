 import { Navigate, Route, Routes } from 'react-router-dom'

import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import ClassListPage from '../pages/teacher/classroom/ClassListPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'


function AppRoutes() {
  return (
    <Routes>
      {/* Route mặc định */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Route Auth */}
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/signup"
        element={<SignupPage />}
      />

      {/* Route teacher */}
      <Route
        path="/teacher"
        element={<TeacherDashboard />}
      />
      <Route
        path="/teacher/classes"
        element={<ClassListPage />}
      />

    </Routes>
  )
}

export default AppRoutes