import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  ImagePlus,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import useAuthStore from '../../stores/authStore'
import defaultAvatar from '../../assets/images/avatar_default.png'

function TeacherProfilePage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

// Mock tạm thời, sau này lấy từ API
  const classCount = 5
  const examCount = 12

  const avatarInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar && user.avatar !== 'avatar'
      ? user.avatar
      : defaultAvatar,
  )

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      event.target.value = ''
      return
    }

    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    console.log('Update profile:', form)

    // TODO: nối API update profile sau
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-5">
      {/* PAGE TITLE */}
      <div className="flex flex-col items-center text-center">
      </div>

      {/* PROFILE HEADER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14532D] via-[#15803D] to-[#16A34A] shadow-lg shadow-green-900/10">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute bottom-[-5rem] left-1/3 h-40 w-40 rounded-full bg-lime-300/10" />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={avatarPreview}
                alt={user?.fullName || 'Ảnh đại diện'}
                onError={() => setAvatarPreview(defaultAvatar)}
                className="h-20 w-20 rounded-2xl border-4 border-white/90 bg-white object-cover shadow-lg sm:h-24 sm:w-24"
              />

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <button
                type="button"
                title="Chọn ảnh đại diện từ máy"
                aria-label="Chọn ảnh đại diện từ máy"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-green-600 text-white shadow-sm transition hover:bg-green-700"
              >
                <ImagePlus size={16} />
              </button>
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-white sm:text-2xl">
                {user?.fullName || user?.username}
              </h2>

              <p className="mt-1 truncate text-sm text-green-100/80">
                @{user?.username}
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
            Giáo viên
          </span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* EDIT PROFILE */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm"
        >
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-lg font-bold text-[#18301D]">
              Thông tin cá nhân
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Cập nhật thông tin hiển thị của tài khoản
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {/* FULL NAME */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#18301D]">
                Họ và tên
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#18301D]">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Nhập email"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#18301D]">
                Số điện thoại
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                />
              </div>
            </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => navigate('/teacher')}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
              >
                <ArrowLeft size={17} />
                Quay về
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                <Save size={17} />
                Lưu thay đổi
              </button>
             </div>
          </div>
        </form>

        {/* ACCOUNT INFO */}
        <section className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
          <ShieldCheck size={19} />
        </div>

        <h3 className="mt-4 font-bold text-[#18301D]">
          Thông tin tài khoản
        </h3>

        {/* ACCOUNT */}
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-gray-400">
              Tên đăng nhập
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-700">
              {user?.username || '---'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">
              Vai trò
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-700">
              Giáo viên
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">
              Trạng thái
            </p>

            <span className="mt-1 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              {user?.status === 'ACTIVE'
                ? 'Đang hoạt động'
                : user?.status || '---'}
            </span>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="my-5 border-t border-gray-100" />

        {/* STATISTICS */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Hoạt động giảng dạy
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* CLASS COUNT */}
            <div className="rounded-xl bg-green-50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-green-600">
                <BookOpen size={16} />
              </div>

              <p className="mt-3 text-xl font-bold text-[#18301D]">
                {classCount}
              </p>

              <p className="mt-1 text-xs leading-4 text-gray-500">
                Lớp đang dạy
              </p>
            </div>

            {/* EXAM COUNT */}
            <div className="rounded-xl bg-lime-50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lime-600">
                <ClipboardCheck size={16} />
              </div>

              <p className="mt-3 text-xl font-bold text-[#18301D]">
                {examCount}
              </p>

              <p className="mt-1 text-xs leading-4 text-gray-500">
                Bài kiểm tra
              </p>
            </div>
          </div>
        </div>
      </section>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl border border-green-100 bg-white p-5 text-left shadow-sm transition hover:border-green-200 hover:bg-green-50/40"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <LockKeyhole size={18} />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#18301D]">
              Đổi mật khẩu
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Chức năng sẽ phát triển sau
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}

export default TeacherProfilePage