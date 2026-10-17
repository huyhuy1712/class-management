import { useMutation } from "@tanstack/react-query";
import { BookOpen, House, LogOut, Users } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { logout as logoutRequest } from "../../services/authService";
import useAuthStore from "../../stores/authStore";
import logo from "../../assets/logos/logo.png";

const menuItems = [
  {
    path: "/admin",
    label: "Tổng quan",
    icon: House,
    end: true,
  },
  {
    path: "/admin/users",
    label: "Quản lý tài khoản",
    icon: Users,
    end: false,
  },
  {
    path: "/admin/subjects",
    label: "Quản lý môn học",
    icon: BookOpen,
    end: false,
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      logout();
      setShowLogoutModal(false);
      navigate("/login", { replace: true });
    },
  });

  function handleLogout() {
    if (!logoutMutation.isPending) logoutMutation.mutate();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng menu"
        onClick={onClose}
        className={`admin-sidebar-overlay ${isOpen ? "is-open" : ""}`}
      />

      <aside className={`admin-sidebar ${isOpen ? "admin-sidebar--open" : ""}`}>
        <NavLink
          to="/admin"
          onClick={onClose}
          aria-label="Về tổng quan quản trị"
          className="admin-sidebar__brand"
        >
          <div className="admin-sidebar__logo">
            <img src={logo} alt="" />
          </div>
          <div>
            <h2>FrogH</h2>
            <span>ADMIN PANEL</span>
          </div>
        </NavLink>

        <div className="admin-sidebar__section">QUẢN LÝ HỆ THỐNG</div>

        <nav className="admin-sidebar__nav" aria-label="Điều hướng quản trị">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `admin-sidebar__link ${isActive ? "active" : ""}`
                }
              >
                <Icon className="admin-sidebar__icon" size={20} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <button
            type="button"
            className="admin-sidebar__logout"
            onClick={() => setShowLogoutModal(true)}
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <LogOut size={19} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !logoutMutation.isPending) {
              setShowLogoutModal(false);
            }
          }}
        >
          <section
            className="admin-modal admin-logout-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-logout-title"
          >
            <div className="admin-modal__header">
              <div>
                <span className="admin-eyebrow">ADMIN PANEL</span>
                <h2 id="admin-logout-title">Xác nhận đăng xuất</h2>
                <p>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản quản trị?</p>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setShowLogoutModal(false)}
                disabled={logoutMutation.isPending}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-danger-btn"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut size={16} />
                {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}