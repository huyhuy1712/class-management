import { useLocation } from "react-router-dom";

export default function AdminHeader() {
  const location = useLocation();

  const pageTitle =
    location.pathname === "/admin/users"
      ? "Quản lý tài khoản"
      : "Tổng quan";

  return (
    <header className="admin-header">
      <div>
        <div className="admin-header__breadcrumb">
          Hệ thống / Admin / {pageTitle}
        </div>
        <h1>{pageTitle}</h1>
      </div>

      <div className="admin-header__right">
        <div className="admin-header__status">
          <span className="admin-status-dot" />
          Hệ thống quản lý lớp học
        </div>

        <div className="admin-header__profile">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>Quản trị viên</span>
          </div>
        </div>
      </div>
    </header>
  );
}