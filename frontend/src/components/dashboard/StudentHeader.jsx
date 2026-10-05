import logo from "../../assets/logos/logo.png";
import {
  Bell,
  UserCircle,
} from "lucide-react";
import useAuthStore from "../../stores/authStore";

function StudentHeader() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="fixed left-[275px] right-0 top-0 z-30 h-[96px] border-b border-[#dcefe3] bg-white">
      <div className="flex h-full items-center justify-between px-8">

        {/* Logo / Title */}
        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5f8eb]">
            <img
                src={logo}
                alt="FrogH"
                className="h-10 w-10 rounded-xl object-contain"
            />
            </div>

          <div className="h-8 w-px bg-[#d9e9df]" />

          <div>
            <h2 className="text-xl font-bold text-[#123d2d]">
              FrogH
            </h2>

            <p className="text-sm text-gray-400">
              Cổng thông tin học sinh
            </p>
          </div>

        </div>


        {/* Right side */}
        <div className="flex items-center gap-5">

          {/* Notification */}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/student/announcements";
            }}
            className="group relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-[#effbf3]"
            aria-label="Thông báo"
            title="Thông báo"
          >

            <Bell
              size={23}
              strokeWidth={2}
              className="text-gray-500 transition group-hover:text-[#159447]"
            />

          </button>


          {/* Avatar */}
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e9eeee]">
              <UserCircle
                size={30}
                className="text-gray-500"
              />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#173c2e]">
                {user?.fullName || "Học sinh"}
              </p>

              <p className="text-xs text-gray-400">
                Học sinh
              </p>
            </div>

          </div>

        </div>

      </div>
    </header>
  );
}

export default StudentHeader;