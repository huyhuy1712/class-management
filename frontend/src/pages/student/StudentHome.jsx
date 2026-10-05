import StudentDashboardLayout from "../../layouts/StudentDashboardLayout";
import StudentDashboard from "../../components/dashboard/StudentDashboard";

function StudentHome() {
  return (
    <StudentDashboardLayout>
      <StudentDashboard />
    </StudentDashboardLayout>
  );
}

export default StudentHome;