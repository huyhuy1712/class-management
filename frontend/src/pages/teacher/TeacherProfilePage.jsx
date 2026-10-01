import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  ImagePlus,
  Trash2,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  ChevronRight,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import useAuthStore from '../../stores/authStore'
import userService from '../../services/userService'
import defaultAvatar from '../../assets/images/avatar_default.png'
import classroomService from '../../services/classroomService'

function TeacherProfilePage() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const navigate = useNavigate()

const [uploadingAvatar, setUploadingAvatar] = useState(false)
const [deletingAvatar, setDeletingAvatar] = useState(false)

const [avatarError, setAvatarError] = useState('')
const [avatarSuccess, setAvatarSuccess] = useState('')
const [saving, setSaving] = useState(false)
const [formError, setFormError] = useState('')
const [formSuccess, setFormSuccess] = useState('')
const [fieldErrors, setFieldErrors] = useState({})

const [classCount, setClassCount] = useState(null)
const [classCountError, setClassCountError] = useState(false)

const [showPasswordModal, setShowPasswordModal] = useState(false)

const [passwordForm, setPasswordForm] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const [passwordError, setPasswordError] = useState('')
const [passwordSuccess, setPasswordSuccess] = useState('')
const [changingPassword, setChangingPassword] = useState(false)
  
useEffect(() => {
  let cancelled = false

  const fetchMyClasses = async () => {
    try {
      setClassCountError(false)

      const classes = await classroomService.getMyClasses()

      if (!cancelled) {
        setClassCount(classes.length)
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách lớp:', error)

      if (!cancelled) {
        setClassCountError(true)
      }
    }
  }

  fetchMyClasses()

  return () => {
    cancelled = true
  }
}, [])

// Mock tạm thời, sau này lấy từ API
const examCount = 12

const avatarInputRef = useRef(null)
const fullNameInputRef = useRef(null)
const emailInputRef = useRef(null)
const phoneInputRef = useRef(null)
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
    setAvatarPreview(
      user?.avatar && user.avatar !== 'avatar'
        ? user.avatar
        : defaultAvatar
    )
  }, [user?.avatar])

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
  }, [user?.fullName, user?.email, user?.phone])

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0]

  if (!file) return

  setAvatarError('')
  setAvatarSuccess('')

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    setAvatarError(
      'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.'
    )

    event.target.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    setAvatarError(
      'Dung lượng ảnh không được vượt quá 2 MB.'
    )

    event.target.value = ''
    return
  }

  try {
    setUploadingAvatar(true)

    const data = await userService.uploadAvatar(file)

    updateUser({
      avatar: data.avatar,
    })
    setAvatarPreview(data.avatar)

    setAvatarSuccess(
      'Cập nhật ảnh đại diện thành công.'
    )
  } catch (err) {
    setAvatarError(
      err.response?.data?.message ||
      'Không thể tải ảnh lên. Vui lòng thử lại.'
    )
  } finally {
    setUploadingAvatar(false)

    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }
}

const handleDeleteAvatar = async () => {
  if (!user?.avatar) return

  setAvatarError('')
  setAvatarSuccess('')

  try {
    setDeletingAvatar(true)

    await userService.deleteAvatar()

    updateUser({
      avatar: null,
    })
    setAvatarPreview(defaultAvatar)

    setAvatarSuccess(
      'Đã gỡ ảnh đại diện thành công.'
    )
  } catch (err) {
    setAvatarError(
      err.response?.data?.message ||
      'Không thể gỡ ảnh đại diện.'
    )
  } finally {
    setDeletingAvatar(false)
  }
}

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setFormSuccess('')
    setFieldErrors({})

    const fullName = form.fullName.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()

    if (fullName.length < 2 || fullName.length > 100) {
      setFormError('Họ và tên phải có từ 2 đến 100 ký tự.')
      return
    }
    if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Email không hợp lệ hoặc vượt quá 255 ký tự.')
      return
    }
    if (phone && !/^(0|\+84)[0-9]{9}$/.test(phone)) {
      setFormError('Số điện thoại Việt Nam không hợp lệ.')
      return
    }

    try {
      setSaving(true)
      const updatedUser = await userService.updateProfile({ fullName, email, phone })
      updateUser(updatedUser)
      setFormSuccess('Cập nhật thông tin cá nhân thành công.')
    } catch (err) {
      const responseData = err.response?.data
      const validationErrors = responseData?.validationErrors || {}
      const errorFields = ['fullName', 'email', 'phone']
      const firstErrorField = errorFields.find((field) => validationErrors[field])

      if (firstErrorField) {
        setFieldErrors(validationErrors)
        if (firstErrorField === 'fullName') fullNameInputRef.current?.focus()
        if (firstErrorField === 'email') emailInputRef.current?.focus()
        if (firstErrorField === 'phone') phoneInputRef.current?.focus()
      } else {
        setFormError(
          responseData?.message ||
          'Không thể cập nhật thông tin cá nhân. Vui lòng thử lại.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = (event) => {
  const { name, value } = event.target

  setPasswordForm((prev) => ({
    ...prev,
    [name]: value,
  }))

  setPasswordError('')
}

const closePasswordModal = () => {
  if (changingPassword) return

  setShowPasswordModal(false)
  setPasswordError('')

  setPasswordForm({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
}

const handleChangePassword = async (event) => {
  event.preventDefault()

  setPasswordError('')
  setPasswordSuccess('')

  const {
    currentPassword,
    newPassword,
    confirmPassword,
  } = passwordForm

  if (!currentPassword || !newPassword || !confirmPassword) {
    setPasswordError('Vui lòng nhập đầy đủ thông tin.')
    return
  }

  if (newPassword.length < 8 || newPassword.length > 100) {
    setPasswordError('Mật khẩu mới phải từ 8 đến 100 ký tự.')
    return
  }

  if (newPassword === currentPassword) {
    setPasswordError(
      'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
    )
    return
  }

  if (newPassword !== confirmPassword) {
    setPasswordError('Xác nhận mật khẩu mới không khớp.')
    return
  }

  try {
    setChangingPassword(true)

    await userService.changePassword(
      currentPassword,
      newPassword,
    )

    setShowPasswordModal(false)

    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })

    setPasswordSuccess('Đổi mật khẩu thành công.')
  } catch (error) {
    console.error('Change password error:', error)

    const message =
      error.response?.data?.message ||
      error.response?.data?.error

    if (error.response?.status === 400) {
      setPasswordError(
        message || 'Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ.',
      )
    } else if (error.response?.status === 401) {
      setPasswordError(
        'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      )
    } else {
      setPasswordError(
        message || 'Không thể đổi mật khẩu. Vui lòng thử lại.',
      )
    }
  } finally {
    setChangingPassword(false)
  }
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
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <button
                type="button"
                title="Chọn ảnh đại diện từ máy"
                aria-label="Chọn ảnh đại diện từ máy"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar || deletingAvatar}
                className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-green-600 text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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

              {user?.avatar && user.avatar !== 'avatar' && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={uploadingAvatar || deletingAvatar}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-100 transition hover:text-white hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  {deletingAvatar ? 'Đang gỡ ảnh...' : 'Gỡ ảnh đại diện'}
                </button>
              )}
              {uploadingAvatar && (
                <p className="mt-2 text-xs text-green-100">Đang tải ảnh lên...</p>
              )}
            </div>
          </div>

          <span className="w-fit rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
            Giáo viên
          </span>
        </div>
      </section>

      {avatarError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {avatarError}
        </div>
      )}
      {avatarSuccess && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {avatarSuccess}
        </div>
      )}

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
                  ref={fullNameInputRef}
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
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

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#18301D]">
                Email
              </label>

              <div className="relative opacity-60">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  disabled
                  ref={emailInputRef}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
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
                  ref={phoneInputRef}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
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

          {formError && (
            <p role="alert" className="text-sm text-red-600">{formError}</p>
          )}
          {formSuccess && (
            <p role="status" className="text-sm text-green-700">{formSuccess}</p>
          )}

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
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                <Save size={17} />
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                {classCountError
                  ? '--'
                  : classCount === null
                    ? '...'
                    : classCount}
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
          onClick={() => {
            setPasswordError('')
            setPasswordSuccess('')
            setShowPasswordModal(true)
          }}
          className="group flex w-full items-center justify-between rounded-2xl border border-green-100 bg-white px-5 py-4 text-left shadow-sm transition-all duration-200 hover:border-green-300 hover:shadow-md"
        >
          {/* Left */}
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 transition-colors duration-200 group-hover:bg-green-100">
              <LockKeyhole size={21} strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-[#18301D]">
                Đổi mật khẩu
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Cập nhật mật khẩu để tăng cường bảo mật tài khoản
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="ml-4 flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-700 transition-all duration-200 group-hover:translate-x-1 group-hover:bg-green-100">
              <ChevronRight size={18} />
            </div>
          </div>
      </button>

      {passwordSuccess && (
        <p role="status" className="text-sm text-green-700">
          {passwordSuccess}
        </p>
      )}

      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePasswordModal()
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
                  Nhập mật khẩu hiện tại và chọn mật khẩu mới.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mật khẩu hiện tại
                </span>
                <input
                  type="password"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={changingPassword}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mật khẩu mới
                </span>
                <input
                  type="password"
                  name="newPassword"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  disabled={changingPassword}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Xác nhận mật khẩu mới
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={changingPassword}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50"
                />
              </label>

              {passwordError && (
                <p role="alert" className="text-sm text-red-600">
                  {passwordError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
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
                  {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      </div>
      
    </div>

    
  )
}

export default TeacherProfilePage