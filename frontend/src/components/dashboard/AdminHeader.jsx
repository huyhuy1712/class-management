import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import useAuthStore from "../../stores/authStore";
import logo from "../../assets/logos/logo.png";

export default function AdminHeader({ onMenuClick }) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const pageTitle = {
    "/admin/users": "Quản lý tài khoản",
    "/admin/subjects": "Quản lý môn học",
  }[location.pathname] || "Tổng quan";
  const displayName = user?.fullName || user?.username || "Administrator";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="admin-header">
      <button
        type="button"
        className="admin-header__menu"
        onClick={onMenuClick}
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>

      <div className="admin-header__page">
        <div className="admin-header__brand-mark">
          <img src={logo} alt="FrogH" />
        </div>
        <div>
          <div className="admin-header__breadcrumb">
            Hệ thống / Admin / {pageTitle}
          </div>
          <h1>{pageTitle}</h1>
        </div>
      </div>

      <div className="admin-header__right">
        <div className="admin-header__status">
          <span className="admin-status-dot" />
          Hệ thống quản lý lớp học
        </div>

        <div className="admin-header__profile">
          <div className="admin-avatar">{initial}</div>
          <div>
            <strong>{displayName}</strong>
            <span>Quản trị viên</span>
          </div>
        </div>
      </div>
    </header>
  );
}