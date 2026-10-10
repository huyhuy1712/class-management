import StudentLogoutModal from './modals/StudentLogoutModal';
import {
  Home,
  BookOpen,
  BarChart3,
  FileCheck,
  LogOut,
} from "lucide-react";

import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import logo from "../../assets/logos/logo.png";
import useAuthStore from "../../stores/authStore";


const menuItems = [
  {
    label: "Trang chủ",
    icon: Home,
    path: "/student",
  },
  {
    label: "Lớp học",
    icon: BookOpen,
    path: "/student/classes",
  },
  {
    label: "Thông tin điểm số",
    icon: BarChart3,
    path: "/student/grades",
  },
  {
    label: "Làm bài kiểm tra",
    icon: FileCheck,
    path: "/student/exams",
  },
];


function StudentSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    onClose?.();
    navigate("/login", { replace: true });
  };

  return (
    <>
    <button type="button" aria-label="Đóng menu" onClick={onClose} className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`} />
    <aside className={`fixed left-0 top-0 z-40 flex h-dvh w-72 max-w-[calc(100vw-3rem)] flex-col bg-[#123524] text-white shadow-xl transition-transform duration-300 lg:w-64 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>

      {/* =========================
          LOGO
      ========================= */}
      <Link to="/student" onClick={onClose} aria-label="Về trang chủ" className="flex h-[96px] items-center border-b border-white/10 px-7">

        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl shadow-lg shadow-black/10">

          <img
            src={logo}
            alt="FrogH"
            className="h-10 w-10 object-contain"
          />

        </div>

        <div>

          <h1 className="text-xl font-bold tracking-tight">
            FrogH
          </h1>

          <p className="text-xs text-green-200/70">
            Education System
          </p>

        </div>

      </Link>


      {/* =========================
          MENU
      ========================= */}
      <div className="flex-1 overflow-y-auto px-3 py-7">

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[2px] text-green-200/50">
          HỌC TẬP
        </p>


        <nav className="space-y-1">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === "/student"}

                className={({ isActive }) =>
                  `
                  group flex items-center gap-4 rounded-xl px-4 py-3.5
                  transition-all duration-200

                  ${
                    isActive
                      ? "bg-[#DCFCE7] text-[#14532D] shadow-sm"
                      : "text-green-50/75 hover:bg-white/10 hover:text-white"
                  }
                  `
                }
              >

                {({ isActive }) => (
                  <>
                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={
                        isActive
                          ? "text-[#14532D]"
                          : "text-green-50/75 group-hover:text-white"
                      }
                    />

                    <span className="text-[15px] font-medium">
                      {item.label}
                    </span>
                  </>
                )}

              </NavLink>
            );

          })}

        </nav>

      </div>


      {/* =========================
          LOGOUT
      ========================= */}
      <div className="border-t border-white/10 p-4">

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-green-50/75 transition hover:bg-red-500/10 hover:text-red-300"
        >

          <LogOut size={21} />

          <span className="text-[15px] font-medium">
            Đăng xuất
          </span>

        </button>

      </div>

    </aside>
    {showLogoutModal && <StudentLogoutModal onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />}
    </>
  );
}


export default StudentSidebar;
