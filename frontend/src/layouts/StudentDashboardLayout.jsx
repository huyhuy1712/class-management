import StudentHeader from "../components/dashboard/StudentHeader";
import StudentSidebar from "../components/dashboard/StudentSidebar";

function StudentDashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f7fbf8]">

      <StudentSidebar />

      <StudentHeader />

      <div className="ml-[275px] min-h-screen">
        {children}
      </div>

    </div>
  );
}

export default StudentDashboardLayout;