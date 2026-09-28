 import { Navigate, Route, Routes } from 'react-router-dom'

import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import ClassListPage from '../pages/teacher/classroom/ClassListPage'


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/teacher" replace />} />

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