import { useRef, useState } from 'react'
import {
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  School,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { signup } from '../../services/authService'
import logo from '../../assets/logos/logo.png'

function SignupPage() {
  const navigate = useNavigate()

  const [role, setRole] = useState('STUDENT')

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const fullNameInputRef = useRef(null)
  const usernameInputRef = useRef(null)
  const emailInputRef = useRef(null)
  const phoneInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setFieldErrors((prev) => ({
      ...prev,
      [name]: '',
    }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextFieldErrors = {}

    if (!form.fullName.trim()) {
      nextFieldErrors.fullName = 'Vui lòng nhập họ và tên.'
    }

    if (!form.username.trim()) {
      nextFieldErrors.username = 'Vui lòng nhập tên đăng nhập.'
    }

    if (!form.email.trim()) {
      nextFieldErrors.email = 'Vui lòng nhập email.'
    }

    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) {
      nextFieldErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.'
    }

    if (!form.password) {
      nextFieldErrors.password = 'Vui lòng nhập mật khẩu.'
    }

    setFieldErrors(nextFieldErrors)
    setError('')

    if (Object.keys(nextFieldErrors).length > 0) {
      if (nextFieldErrors.fullName) {
        fullNameInputRef.current?.focus()
      } else if (nextFieldErrors.username) {
        usernameInputRef.current?.focus()
      } else if (nextFieldErrors.email) {
        emailInputRef.current?.focus()
      } else if (nextFieldErrors.phone) {
        phoneInputRef.current?.focus()
      } else {
        passwordInputRef.current?.focus()
      }

      return
    }

    try {
      setLoading(true)

      await signup({
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        avatar: '',
        role,
      })

      navigate('/login', {
        state: {
          signupSuccess: true,
        },
      })
    } catch (error) {
      const responseData = error.response?.data
      const validationErrors = responseData?.validationErrors || {}
      const backendMessage = responseData?.message || ''
      const nextFieldErrors = { ...validationErrors }
      const normalizedMessage = backendMessage.toLowerCase()

      if (
        normalizedMessage.includes('username') ||
        normalizedMessage.includes('tên đăng nhập')
      ) {
        nextFieldErrors.username = backendMessage
      } else if (normalizedMessage.includes('email')) {
        nextFieldErrors.email = backendMessage
      } else if (
        normalizedMessage.includes('phone') ||
        normalizedMessage.includes('số điện thoại')
      ) {
        nextFieldErrors.phone = backendMessage
      } else if (
        normalizedMessage.includes('password') ||
        normalizedMessage.includes('mật khẩu')
      ) {
        nextFieldErrors.password = backendMessage
      } else if (
        normalizedMessage.includes('full name') ||
        normalizedMessage.includes('họ và tên')
      ) {
        nextFieldErrors.fullName = backendMessage
      }

      setFieldErrors(nextFieldErrors)

      const firstErrorField = [
        'fullName',
        'username',
        'email',
        'phone',
        'password',
      ].find((field) => nextFieldErrors[field])

      if (firstErrorField === 'fullName') {
        fullNameInputRef.current?.focus()
      } else if (firstErrorField === 'username') {
        usernameInputRef.current?.focus()
      } else if (firstErrorField === 'email') {
        emailInputRef.current?.focus()
      } else if (firstErrorField === 'phone') {
        phoneInputRef.current?.focus()
      } else if (firstErrorField === 'password') {
        passwordInputRef.current?.focus()
      }

      setError(firstErrorField ? '' : backendMessage || 'Đăng ký thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F5FAF4] lg:flex-row">
      <section className="hidden w-1/2 flex-col justify-between bg-[#123524] p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl">
            <img src={logo} alt="Class Management" className="h-14 w-14 object-contain" />
          </div>

          <div>
            <h1 className="font-bold text-white">FrogH</h1>
            <p className="text-sm text-green-200">Education System</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Bắt đầu hành trình
            <span className="text-lime-400"> học tập của bạn.</span>
          </h2>

          <p className="mt-5 leading-7 text-green-100/70">
            Tạo tài khoản để tham gia lớp học hoặc quản lý lớp với vai trò
            giáo viên.
          </p>
        </div>

        <p className="text-sm text-green-200/50">
          Made by FrogH
        </p>
      </section>

      <section className="flex w-full min-w-0 flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="w-full min-w-0 max-w-md">
          <div className="mb-7">
            <h1 className="text-3xl font-bold text-[#18301D]">
                Đăng ký tài khoản
            </h1>
            <p className="mt-2 text-gray-500">
              Điền thông tin để đăng ký tài khoản mới.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-green-50 p-1.5">
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                role === 'STUDENT'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <GraduationCap size={18} />
              Học sinh
            </button>

            <button
              type="button"
              onClick={() => setRole('TEACHER')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                role === 'TEACHER'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <School size={18} />
              Giáo viên
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={fullNameInputRef}
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Họ và tên *"
              className={`w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-green-100 ${
                fieldErrors.fullName
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-green-100 focus:border-green-500'
              }`}
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
            )}

            <input
              ref={usernameInputRef}
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Tên đăng nhập *"
              className={`w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-green-100 ${
                fieldErrors.username
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-green-100 focus:border-green-500'
              }`}
            />
            {fieldErrors.username && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
            )}

            <input
              ref={emailInputRef}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email *"
              className={`w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-green-100 ${
                fieldErrors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-green-100 focus:border-green-500'
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}

            <input
              ref={phoneInputRef}
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={handleChange}
              placeholder="Số điện thoại"
              className={`w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-green-100 ${
                fieldErrors.phone
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-green-100 focus:border-green-500'
              }`}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
            )}

            <div className="relative">
              <input
                ref={passwordInputRef}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Mật khẩu *"
                className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 outline-none focus:ring-4 focus:ring-green-100 ${
                  fieldErrors.password
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-green-100 focus:border-green-500'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {loading && <LoaderCircle size={18} className="animate-spin" />}
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-semibold text-green-700 hover:text-green-800"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}

export default SignupPage