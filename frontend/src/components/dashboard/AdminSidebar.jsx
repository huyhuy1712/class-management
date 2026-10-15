import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { logout as logoutRequest } from "../../services/authService";
import useAuthStore from "../../stores/authStore";

const menuItems = [
  {
    path: "/admin",
    label: "Tổng quan",
    icon: "⌂",
    end: true,
  },
  {
    path: "/admin/users",
    label: "Quản lý tài khoản",
    icon: "♙",
    end: false,
  },
  {
    path: "/admin/subjects",
    label: "Quản lý môn học",
    icon: "◇",
    end: false,
  },
];

export default function AdminSidebar() {
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
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__logo">A</div>
        <div>
          <h2>ClassManager</h2>
          <span>ADMIN PANEL</span>
        </div>
      </div>

      <div className="admin-sidebar__section">QUẢN LÝ HỆ THỐNG</div>

      <nav className="admin-sidebar__nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? "active" : ""}`
            }
          >
            <span className="admin-sidebar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
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
    </aside>
  );
}