import {
  Home,
  ClipboardCheck,
  BookOpen,
  BarChart3,
  FileCheck,
  LogOut,
} from "lucide-react";

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../../assets/logos/logo.png";
import useAuthStore from "../../stores/authStore";


const menuItems = [
  {
    label: "Trang chủ",
    icon: Home,
    path: "/student",
  },
  {
    label: "Điểm danh",
    icon: ClipboardCheck,
    path: "/student/attendance",
  },
  {
    label: "Vào lớp học",
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


function StudentSidebar() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[275px] flex-col bg-[#0b3d2e] text-white">

      {/* =========================
          LOGO
      ========================= */}
      <div className="flex h-[96px] items-center border-b border-white/10 px-7">

        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5f8eb]">

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

          <p className="text-xs text-white/60">
            Education System
          </p>

        </div>

      </div>


      {/* =========================
          MENU
      ========================= */}
      <div className="flex-1 overflow-y-auto px-3 py-7">

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[2px] text-white/40">
          HỌC TẬP
        </p>


        <nav className="space-y-1">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/student"}

                className={({ isActive }) =>
                  `
                  group flex items-center gap-4 rounded-xl px-4 py-3.5
                  transition-all duration-200

                  ${
                    isActive
                      ? "bg-[#d9f7e3] text-[#145c3f] shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
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
                          ? "text-[#168447]"
                          : "text-white/60 group-hover:text-white"
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
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-white/70 transition hover:bg-red-500/10 hover:text-red-300"
        >

          <LogOut size={21} />

          <span className="text-[15px] font-medium">
            Đăng xuất
          </span>

        </button>

      </div>

    </aside>
    {showLogoutModal && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
        onClick={() => setShowLogoutModal(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-logout-title"
          className="w-full max-w-sm rounded-2xl bg-white p-6 text-[#18301D] shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <LogOut size={22} className="text-red-500" />
          </div>
          <div className="mt-4 text-center">
            <h2 id="student-logout-title" className="text-xl font-bold">
              Xác nhận đăng xuất
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại?
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <LogOut size={17} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}


export default StudentSidebar;