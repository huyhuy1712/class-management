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
import AuthLayout from './components/AuthLayout'

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
      setLoading(true)

      const signupResult = await signup({
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout variant="signup" title="Đăng ký tài khoản" description="Điền thông tin để đăng ký tài khoản mới.">
          <div className="auth-roles">
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className="auth-role"
              aria-pressed={role === 'STUDENT'}
            >
              <GraduationCap size={18} />
              Học sinh
            </button>

            <button
              type="button"
              onClick={() => setRole('TEACHER')}
              className="auth-role"
              aria-pressed={role === 'TEACHER'}
            >
              <School size={18} />
              Giáo viên
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={fullNameInputRef}
              name="fullName"
                aria-label="Họ và tên"
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.fullName)}
              value={form.fullName}
              onChange={handleChange}
              placeholder="Họ và tên *"
              className={`auth-input ${fieldErrors.fullName ? 'auth-input--error' : ''}`}
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
            )}

            <input
              ref={usernameInputRef}
              name="username"
                aria-label="Tên đăng nhập"
                autoComplete="username"
                aria-invalid={Boolean(fieldErrors.username)}
              value={form.username}
              onChange={handleChange}
              placeholder="Tên đăng nhập *"
              className={`auth-input ${fieldErrors.username ? 'auth-input--error' : ''}`}
            />
            {fieldErrors.username && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
            )}

            <input
              ref={emailInputRef}
              name="email"
                aria-label="Email"
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email *"
              className={`auth-input ${fieldErrors.email ? 'auth-input--error' : ''}`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}

            <input
              ref={phoneInputRef}
              name="phone"
                aria-label="Số điện thoại"
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.phone)}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={handleChange}
              placeholder="Số điện thoại"
              className={`auth-input ${fieldErrors.phone ? 'auth-input--error' : ''}`}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
            )}

            <div className="relative">
              <input
                ref={passwordInputRef}
                name="password"
                aria-label="Mật khẩu"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Mật khẩu *"
                className={`auth-input auth-input--password ${fieldErrors.password ? 'auth-input--error' : ''}`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
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
              className="auth-submit"
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
    </AuthLayout>
  )
}

export default SignupPage