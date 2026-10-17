import { useState } from "react";
import { Outlet } from "react-router-dom";

import AdminHeader from "../components/dashboard/AdminHeader";
import AdminSidebar from "../components/dashboard/AdminSidebar";

export default function AdminDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-layout__main">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}