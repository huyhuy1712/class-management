import { useRef, useState } from 'react'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { login } from '../../services/authService'
import useAuthStore from '../../stores/authStore'
import AuthLayout from './components/AuthLayout'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)
  const signupResult = location.state?.signupSuccess
    ? location.state
    : null

  const [form, setForm] = useState({
    username: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const usernameInputRef = useRef(null)
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

    if (!form.username.trim()) {
      nextFieldErrors.username = 'Vui lòng nhập tên đăng nhập.'
    }

    if (!form.password) {
      nextFieldErrors.password = 'Vui lòng nhập mật khẩu.'
    }

    setFieldErrors(nextFieldErrors)
    setError('')

    if (Object.keys(nextFieldErrors).length > 0) {
      if (nextFieldErrors.username) {
        usernameInputRef.current?.focus()
      } else {
        passwordInputRef.current?.focus()
      }

      return
    }

    try {
      setLoading(true)

      const data = await login({
        username: form.username.trim(),
        password: form.password,
      })

      const user = {
        id: data.id,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        avatar: data.avatar,
        studentCode: data.studentCode,
        teacherCode: data.teacherCode,
        role: data.role,
        status: data.status,
      }

      setAuth(user)

      if (data.role === 'TEACHER') {
        navigate('/teacher')
      } else if (data.role === 'STUDENT') {
        navigate('/student')
      } else if (data.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Tên đăng nhập hoặc mật khẩu không chính xác.'

      if (error.response?.status === 400 || error.response?.status === 401) {
        const normalizedMessage = message.toLowerCase()
        const isUsernameError =
          normalizedMessage.includes('username') ||
          normalizedMessage.includes('tên đăng nhập')
        const isPasswordError =
          normalizedMessage.includes('password') ||
          normalizedMessage.includes('mật khẩu')

        if (isUsernameError) {
          setFieldErrors({ username: message })
          usernameInputRef.current?.focus()
        } else if (isPasswordError) {
          setFieldErrors({ password: message })
          passwordInputRef.current?.focus()
        } else {
          setError(message)
        }
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Đăng nhập" description="Đăng nhập để tiếp tục sử dụng hệ thống.">
          {signupResult && (
            <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <p className="font-semibold">
                {signupResult.signupRole === 'TEACHER'
                  ? 'Đăng ký thành công. Tài khoản đang chờ quản trị viên duyệt.'
                  : 'Đăng ký thành công.'}
              </p>
              {signupResult.signupCode && (
                <p className="mt-1">
                  {signupResult.signupRole === 'TEACHER' ? 'Mã giáo viên' : 'Mã học sinh'}:{' '}
                  <strong>{signupResult.signupCode}</strong>
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Tên đăng nhập
              </label>

              <input
                ref={usernameInputRef}
                name="username"
                aria-label="Tên đăng nhập"
                autoComplete="username"
                aria-invalid={Boolean(fieldErrors.username)}
                value={form.username}
                onChange={handleChange}
                placeholder="Nhập tên đăng nhập"
                className={`auth-input ${fieldErrors.username ? 'auth-input--error' : ''}`}
              />

              {fieldErrors.username && (
                <p className="mt-2 text-sm text-red-600">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Mật khẩu
              </label>

              <div className="relative">
                <input
                  ref={passwordInputRef}
                  name="password"
                aria-label="Mật khẩu"
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
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
                <p className="mt-2 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
            >
              {loading && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link
              to="/signup"
              className="font-semibold text-green-700 hover:text-green-800"
            >
              Đăng ký
            </Link>
          </p>
    </AuthLayout>
  )
}

export default LoginPage
