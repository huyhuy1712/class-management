import { ChevronRight, LockKeyhole } from 'lucide-react'

export default function ProfileSecuritySection({
  googleLinkedQuery,
  passwordSuccess,
  onOpenPasswordModal,
}) {
  return (
    <>
      <button
        type="button"
        onClick={onOpenPasswordModal}
        disabled={googleLinkedQuery.isLoading || googleLinkedQuery.isError}
        className="group flex w-full items-center justify-between rounded-2xl border border-green-100 bg-white px-5 py-4 text-left shadow-sm transition-all duration-200 hover:border-green-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 transition-colors duration-200 group-hover:bg-green-100">
            <LockKeyhole size={21} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#18301D]">Đổi mật khẩu</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              {googleLinkedQuery.data === true
                ? 'Tài khoản đã xác thực Google không thể đổi mật khẩu.'
                : googleLinkedQuery.isLoading
                  ? 'Đang kiểm tra phương thức đăng nhập...'
                  : googleLinkedQuery.isError
                    ? 'Không thể xác minh phương thức đăng nhập.'
                    : 'Cập nhật mật khẩu để tăng cường bảo mật tài khoản'}
            </p>
          </div>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-700 transition-all duration-200 group-hover:translate-x-1 group-hover:bg-green-100">
            <ChevronRight size={18} />
          </div>
        </div>
      </button>

      {googleLinkedQuery.isError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          Không thể kiểm tra trạng thái liên kết Google. Vui lòng tải lại trang.
        </p>
      )}
      {passwordSuccess && (
        <p role="status" className="text-sm text-green-700">{passwordSuccess}</p>
      )}
    </>
  )
}
