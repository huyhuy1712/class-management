import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Eye, EyeOff, LoaderCircle, Leaf, Sprout, Trees, BookOpen, GraduationCap } from 'lucide-react'
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
  const mutation = useMutation({ mutationFn: login })
  const loading = mutation.isPending
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
    if (loading) return
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

      const data = await mutation.mutateAsync({
        username: form.username.trim(),
        password: form.password,
      })

      const normalizedRole = String(data?.role ?? '').trim().toUpperCase()
      const user = {
        id: data.id,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        avatar: data.avatar,
        studentCode: data.studentCode,
        teacherCode: data.teacherCode,
        role: normalizedRole,
        status: data.status,
      }

      setAuth(user)

      if (normalizedRole === 'TEACHER') {
        navigate('/teacher')
      } else if (normalizedRole === 'STUDENT') {
        navigate('/student')
      } else if (normalizedRole === 'ADMIN') {
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
          <span className="mb-5 inline-block rounded-full border border-green-100 bg-white/70 px-4 py-2 text-sm font-medium text-green-700">
            Quản lý lớp học thông minh
          </span>

          <h2 className="text-3xl font-bold leading-tight tracking-tight text-[#123524] sm:text-4xl lg:text-5xl lg:leading-[1.2]">
            Học tập và giảng dạy
            <span className="text-green-600"> hiệu quả hơn.</span>
          </h2>

          <p className="mt-5 leading-7 text-gray-500">
            Hãy nạp lần đầu đi
          </p>
        </div>

        <p className="mt-8 hidden text-sm text-green-700 lg:block">
          Made by FrogH
        </p>
      </section>

      <section className="flex w-full min-w-0 items-center justify-center">
        <div className="login-card w-full min-w-0 max-w-[420px] rounded-[28px] border border-green-100 bg-white px-6 py-8 sm:px-9 sm:py-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#18301D]">
              Đăng nhập
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
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
              <label htmlFor="login-username" className="mb-2 block text-sm font-semibold text-gray-700">
                Tên đăng nhập
              </label>

              <input
                ref={usernameInputRef}
                id="login-username"
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
              <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-gray-700">
                Mật khẩu
              </label>

              <div className="relative">
                <input
                  ref={passwordInputRef}
                  id="login-password"
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
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
    </div>
  )
}

export default LoginPage
