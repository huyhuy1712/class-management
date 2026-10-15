import { Outlet } from "react-router-dom";

import AdminHeader from "../components/dashboard/AdminHeader";
import AdminSidebar from "../components/dashboard/AdminSidebar";

export default function AdminDashboardLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-layout__main">
        <AdminHeader />

        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}