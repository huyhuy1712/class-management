import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import {
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  School,
  Leaf,
  Sprout,
  Trees,
  BookOpen,
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
  const mutation = useMutation({ mutationFn: signup })
  const loading = mutation.isPending
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const fullNameInputRef = useRef(null)
  const usernameInputRef = useRef(null)
  const emailInputRef = useRef(null)
  const phoneInputRef = useRef(null)
  const passwordInputRef = useRef(null)
  const fieldInputRefs = {
    fullName: fullNameInputRef,
    username: usernameInputRef,
    email: emailInputRef,
    phone: phoneInputRef,
    password: passwordInputRef,
  }

  const focusFirstFieldError = (errors) => {
    const firstErrorField = Object.keys(fieldInputRefs).find(
      (field) => errors[field],
    )

    if (firstErrorField) {
      fieldInputRefs[firstErrorField].current?.focus()
    }

    return firstErrorField
  }

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
    if (loading) return
    const nextFieldErrors = {}

    const fullName = form.fullName.trim()
    const username = form.username.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()

    if (!fullName) {
      nextFieldErrors.fullName = 'Vui lòng nhập họ và tên.'
    } else if (fullName.length > 100) {
      nextFieldErrors.fullName = 'Họ và tên không được vượt quá 100 ký tự.'
    }

    if (!username) {
      nextFieldErrors.username = 'Vui lòng nhập tên đăng nhập.'
    } else if (username.length < 4 || username.length > 50) {
      nextFieldErrors.username =
        'Tên đăng nhập phải có từ 4 đến 50 ký tự.'
    }

    if (!email) {
      nextFieldErrors.email = 'Vui lòng nhập email.'
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      nextFieldErrors.email = 'Email phải có định dạng hợp lệ và kết thúc bằng @gmail.com.'
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      nextFieldErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.'
    }

    if (!form.password) {
      nextFieldErrors.password = 'Vui lòng nhập mật khẩu.'
    } else if (form.password.length < 8 || form.password.length > 100) {
      nextFieldErrors.password = 'Mật khẩu phải có từ 8 đến 100 ký tự.'
    }

    setFieldErrors(nextFieldErrors)
    setError('')

    if (Object.keys(nextFieldErrors).length > 0) {
      focusFirstFieldError(nextFieldErrors)
      return
    }

    try {

      const signupResult = await mutation.mutateAsync({
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
          signupRole: signupResult.role,
          signupCode:
            signupResult.role === 'TEACHER'
              ? signupResult.teacherCode
              : signupResult.studentCode,
        },
      })
    } catch (error) {
      const responseData = error.response?.data
      const validationErrors =
        responseData?.validationErrors || responseData?.errors || {}
      const nextFieldErrors = Object.fromEntries(
        Object.entries(validationErrors).filter(([field]) =>
          Object.hasOwn(fieldInputRefs, field),
        ),
      )
      const backendMessage =
        responseData?.message || responseData?.detail || ''
      const normalizedMessage = backendMessage.toLowerCase()

      if (!nextFieldErrors.username && (
        normalizedMessage.includes('username') ||
        normalizedMessage.includes('tên đăng nhập')
      )) {
        nextFieldErrors.username = backendMessage
      } else if (!nextFieldErrors.email && normalizedMessage.includes('email')) {
        nextFieldErrors.email = backendMessage
      } else if (!nextFieldErrors.phone && (
        normalizedMessage.includes('phone') ||
        normalizedMessage.includes('số điện thoại')
      )) {
        nextFieldErrors.phone = backendMessage
      } else if (!nextFieldErrors.password && (
        normalizedMessage.includes('password') ||
        normalizedMessage.includes('mật khẩu')
      )) {
        nextFieldErrors.password = backendMessage
      } else if (!nextFieldErrors.fullName && (
        normalizedMessage.includes('full name') ||
        normalizedMessage.includes('họ và tên') ||
        normalizedMessage.includes('họ tên')
      )) {
        nextFieldErrors.fullName = backendMessage
      }

      setFieldErrors(nextFieldErrors)
      const firstErrorField = focusFirstFieldError(nextFieldErrors)
      const fallbackMessage = !error.response
        ? 'Không thể kết nối tới máy chủ đăng ký. Vui lòng kiểm tra kết nối rồi thử lại.'
        : error.response.status === 404
          ? 'Không tìm thấy API đăng ký (HTTP 404). Vui lòng kiểm tra cấu hình URL backend hoặc thử lại sau.'
          : error.response.status >= 500
            ? `Máy chủ gặp lỗi khi xử lý đăng ký (HTTP ${error.response.status}). Vui lòng thử lại sau.`
            : `Đăng ký không thành công (HTTP ${error.response.status}). Vui lòng kiểm tra thông tin và thử lại.`

      setError(
        firstErrorField ? '' : backendMessage || fallbackMessage,
      )
    }
  }

  return (
    <div className="login-scene relative isolate flex min-h-screen w-full flex-col overflow-hidden bg-[#F5FAF4]">
      <div aria-hidden="true" className="login-nature pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-canopy login-canopy-top" />
        <div className="login-canopy login-canopy-bottom" />
        <Leaf className="login-float login-leaf-one" strokeWidth={1.3} />
        <Sprout className="login-float login-sprout" strokeWidth={1.3} />
        <Trees className="login-float login-trees" strokeWidth={1.2} />
        <BookOpen className="login-float login-book" strokeWidth={1.3} />
        <GraduationCap className="login-float login-cap" strokeWidth={1.3} />
        <Leaf className="login-float login-leaf-two" strokeWidth={1.3} />
      </div>
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center gap-3 px-6 pt-6 sm:px-10 sm:pt-9">
        <img src={logo} alt="Class Management" className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
        <div>
          <p className="text-xl font-bold text-[#18301D]">FrogH</p>
          <p className="text-sm text-green-700">Education System</p>
        </div>
      </header>
      <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-5 py-10 sm:px-10 lg:grid-cols-[1fr_420px] lg:gap-16 lg:py-14">
      <section className="flex min-w-0 flex-col justify-center text-center lg:text-left">
        <div className="mx-auto max-w-xl lg:mx-0">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-[#123524] sm:text-4xl lg:text-5xl lg:leading-[1.2]">
            Bắt đầu hành trình
            <span className="text-green-600"> học tập của bạn.</span>
          </h2>

          <p className="mt-5 leading-7 text-gray-500">
            Tạo tài khoản để tham gia lớp học hoặc quản lý lớp với vai trò
            giáo viên.
          </p>
        </div>

        <p className="mt-8 hidden text-sm text-green-700 lg:block">
          Made by FrogH
        </p>
      </section>

      <section className="flex w-full min-w-0 items-center justify-center">
        <div className="login-card w-full min-w-0 max-w-[420px] rounded-[28px] border border-green-100 bg-white px-6 py-8 sm:px-9 sm:py-10">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-bold text-[#18301D]">
                Đăng ký tài khoản
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
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
    </div>
  )
}

export default SignupPage
