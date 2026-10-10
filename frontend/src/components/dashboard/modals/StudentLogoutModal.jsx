import { LogOut } from 'lucide-react'

export default function StudentLogoutModal({ onClose, onConfirm }) {
  return (
<div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
        onClick={() => onClose()}
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
              onClick={() => onClose()}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <LogOut size={17} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
  )
}

