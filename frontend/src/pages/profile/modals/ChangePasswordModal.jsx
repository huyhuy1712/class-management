import { LockKeyhole } from 'lucide-react'
import FrogLoading from '../../../utils/FrogLoading'

export default function ChangePasswordModal({
  open,
  googleLinked,
  passwordForm,
  passwordError,
  changingPassword,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h2 id="change-password-title" className="text-lg font-bold text-[#18301D]">
              Đổi mật khẩu
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {googleLinked
                ? 'Tài khoản đã xác thực Google không thể đổi mật khẩu.'
                : 'Nhập mật khẩu hiện tại và chọn mật khẩu mới.'}
            </p>
          </div>
        </div>

        {googleLinked ? (
          <div className="flex justify-end border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <PasswordField
              label="Mật khẩu hiện tại"
              name="currentPassword"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              disabled={changingPassword}
              onChange={onChange}
            />
            <PasswordField
              label="Mật khẩu mới"
              name="newPassword"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              disabled={changingPassword}
              onChange={onChange}
            />
            <PasswordField
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              disabled={changingPassword}
              onChange={onChange}
            />

            {passwordError && <p role="alert" className="text-sm text-red-600">{passwordError}</p>}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={changingPassword}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPassword ? <FrogLoading compact label="Đang cập nhật..." /> : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

function PasswordField({ label, name, autoComplete, value, disabled, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type="password"
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50"
      />
    </label>
  )
}
