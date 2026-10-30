import { ArrowLeft, Mail, Phone, Save, UserRound } from 'lucide-react'
import FrogLoading from '../../../utils/FrogLoading'

export default function ProfileInformationForm({
  form,
  fieldErrors,
  formError,
  formSuccess,
  fullNameInputRef,
  emailInputRef,
  phoneInputRef,
  saving,
  onChange,
  onSubmit,
  onReturn,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm lg:self-start"
    >
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-lg font-bold text-[#18301D]">Thông tin cá nhân</h2>
        <p className="mt-1 text-sm text-gray-400">Cập nhật thông tin hiển thị của tài khoản</p>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#18301D]">Họ và tên</label>
          <div className="relative">
            <UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={fullNameInputRef}
              name="fullName"
              value={form.fullName}
              onChange={onChange}
              placeholder="Nhập họ và tên"
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'profile-fullName-error' : undefined}
              className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100 ${fieldErrors.fullName ? 'border-red-400' : 'border-gray-200'}`}
            />
          </div>
          {fieldErrors.fullName && (
            <p id="profile-fullName-error" role="alert" className="mt-1 text-sm text-red-600">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#18301D]">Email</label>
          <div className="relative opacity-60">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              disabled
              ref={emailInputRef}
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Nhập email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'profile-email-error' : undefined}
              className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100 ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'}`}
            />
          </div>
          {fieldErrors.email && (
            <p id="profile-email-error" role="alert" className="mt-1 text-sm text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#18301D]">Số điện thoại</label>
          <div className="relative">
            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={phoneInputRef}
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="Nhập số điện thoại"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'profile-phone-error' : undefined}
              className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100 ${fieldErrors.phone ? 'border-red-400' : 'border-gray-200'}`}
            />
          </div>
          {fieldErrors.phone && (
            <p id="profile-phone-error" role="alert" className="mt-1 text-sm text-red-600">
              {fieldErrors.phone}
            </p>
          )}
        </div>

        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
        {formSuccess && <p role="status" className="text-sm text-green-700">{formSuccess}</p>}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={onReturn}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
          >
            <ArrowLeft size={17} />
            Quay về
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <Save size={17} />
            {saving ? <FrogLoading compact label="Đang lưu..." /> : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </form>
  )
}
