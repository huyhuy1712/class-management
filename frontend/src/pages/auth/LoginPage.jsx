import { useRef, useState } from 'react'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { login } from '../../services/authService'
import useAuthStore from '../../stores/authStore'
import logo from '../../assets/logos/logo.png'

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
          <span className="mb-5 inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-green-100">
            Quản lý lớp học thông minh
          </span>

          <h2 className="text-4xl font-bold leading-tight text-white">
            Học tập và giảng dạy
            <span className="text-lime-400"> hiệu quả hơn.</span>
          </h2>

          <p className="mt-5 leading-7 text-green-100/70">
            Hãy nạp lần đầu đi
          </p>
        </div>

        <p className="text-sm text-green-200/50">
          Made by FrogH
        </p>
      </section>

      <section className="flex w-full min-w-0 flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full min-w-0 max-w-md">
          <div className="mb-9 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl">
                <img src={logo} alt="Class Management" className="h-12 w-12 object-contain" />
              </div>
              <span className="font-bold text-[#18301D]">
                FrogH
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#18301D]">
              Đăng nhập
            </h1>

            <p className="mt-2 text-gray-500">
              Đăng nhập để tiếp tục sử dụng hệ thống.
            </p>
          </div>

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
                value={form.username}
                onChange={handleChange}
                placeholder="Nhập tên đăng nhập"
                className={`w-full rounded-xl border bg-white px-4 py-3.5 outline-none transition focus:ring-4 ${
                  fieldErrors.username
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-green-100 focus:border-green-500 focus:ring-green-100'
                }`}
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
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  className={`w-full rounded-xl border bg-white px-4 py-3.5 pr-12 outline-none transition focus:ring-4 ${
                    fieldErrors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'border-green-100 focus:border-green-500 focus:ring-green-100'
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LoaderCircle
                size={18}
                className={loading ? 'animate-spin' : 'invisible'}
                aria-hidden="true"
              />
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
        </div>
      </section>
    </div>
  )
}

export default LoginPage