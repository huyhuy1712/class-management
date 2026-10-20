import FrogLoading from '../../utils/FrogLoading'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  School,
  Leaf,
  Sprout,
  Trees,
  BookOpen,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { resendEmailVerificationCode, signup, updatePendingSignup, verifyEmail } from '../../services/authService'
import logo from '../../assets/logos/logo.png'
import GoogleAuthButton from '../../components/auth/GoogleAuthButton'

function SignupPage() {
  const navigate = useNavigate()
  const [savedPendingState] = useState(() => {
    const value = window.sessionStorage.getItem('pendingEmailVerification')
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      window.sessionStorage.removeItem('pendingEmailVerification')
      return null
    }
  })
  const restoredSignup = savedPendingState?.signupResult ?? savedPendingState

  const [role, setRole] = useState(restoredSignup?.role ?? 'STUDENT')

  const [form, setForm] = useState(savedPendingState?.form ? { ...savedPendingState.form, password: '' } : {
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const mutation = useMutation({ mutationFn: signup })
  const updateMutation = useMutation({ mutationFn: updatePendingSignup })
  const verificationMutation = useMutation({ mutationFn: verifyEmail })
  const resendMutation = useMutation({ mutationFn: resendEmailVerificationCode })
  const loading = mutation.isPending || updateMutation.isPending
  const [verificationPending, setVerificationPending] = useState(Boolean(restoredSignup?.email))
  const [editingPending, setEditingPending] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState(restoredSignup?.email ?? '')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationResult, setVerificationResult] = useState(restoredSignup)
  const [currentPassword, setCurrentPassword] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [verificationNotice, setVerificationNotice] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
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

  const savePendingSignup = (signupResult, signupForm) => {
    window.sessionStorage.setItem('pendingEmailVerification', JSON.stringify({
      signupResult,
      form: { ...signupForm, password: '' },
    }))
  }

  useEffect(() => {
    if (!verificationPending || resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((remaining) => Math.max(remaining - 1, 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [verificationPending, resendCooldown])

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

      setVerificationEmail(signupResult.email)
      setVerificationResult(signupResult)
      setCurrentPassword(form.password)
      savePendingSignup(signupResult, form)
      setVerificationPending(true)
      setVerificationCode('')
      setVerificationError('')
      setResendCooldown(60)
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

  const handleUpdatePendingSignup = async (event) => {
    event.preventDefault()
    if (loading) return
    const nextFieldErrors = {}
    const fullName = form.fullName.trim()
    const username = form.username.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()

    if (!fullName || fullName.length > 100) nextFieldErrors.fullName = 'Vui lòng nhập họ tên hợp lệ (tối đa 100 ký tự).'
    if (username.length < 4 || username.length > 50) nextFieldErrors.username = 'Tên đăng nhập phải có từ 4 đến 50 ký tự.'
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) nextFieldErrors.email = 'Email phải có định dạng hợp lệ và kết thúc bằng @gmail.com.'
    if (phone && !/^\d{10}$/.test(phone)) nextFieldErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.'
    if (form.password.length < 8 || form.password.length > 100) nextFieldErrors.password = 'Mật khẩu mới phải có từ 8 đến 100 ký tự.'
    if (!currentPassword) nextFieldErrors.currentPassword = 'Nhập mật khẩu hiện tại để xác nhận thay đổi.'
    setFieldErrors(nextFieldErrors)
    setError('')
    if (Object.keys(nextFieldErrors).length) return

    try {
      const updatedSignup = await updateMutation.mutateAsync({
        currentEmail: verificationResult.email,
        currentPassword,
        signup: {
          username,
          password: form.password,
          email,
          fullName,
          phone,
          avatar: verificationResult.avatar ?? '',
          role: verificationResult.role,
        },
      })
      setVerificationResult(updatedSignup)
      setVerificationEmail(updatedSignup.email)
      setVerificationPending(true)
      setEditingPending(false)
      setVerificationCode('')
      setVerificationError('')
      setVerificationNotice(updatedSignup.email === verificationEmail
        ? 'Đã cập nhật thông tin. Mã OTP hiện tại vẫn dùng được.'
        : 'Đã cập nhật email. Mã xác nhận mới đã được gửi tới email mới.')
      setResendCooldown(updatedSignup.email === verificationEmail ? resendCooldown : 60)
      setCurrentPassword('')
      savePendingSignup(updatedSignup, form)
    } catch (requestError) {
      const responseData = requestError.response?.data
      const backendMessage = responseData?.message || ''
      const validationErrors = responseData?.validationErrors || {}
      setFieldErrors((current) => ({ ...current, ...validationErrors }))
      if (backendMessage.includes('mật khẩu') || backendMessage.includes('xác minh')) {
        setFieldErrors((current) => ({ ...current, currentPassword: backendMessage }))
      }
      setError(backendMessage || 'Không thể cập nhật đăng ký. Vui lòng kiểm tra lại thông tin.')
    }
  }

  const handleVerifyEmail = async (event) => {
    event.preventDefault()
    if (verificationMutation.isPending) return
    if (!/^\d{6}$/.test(verificationCode)) {
      setVerificationError('Vui lòng nhập mã xác nhận gồm 6 chữ số.')
      return
    }
    setVerificationError('')
    try {
      const verifiedSignup = await verificationMutation.mutateAsync({ email: verificationEmail, code: verificationCode })
      window.sessionStorage.removeItem('pendingEmailVerification')
      navigate('/login', {
        replace: true,
        state: {
          signupSuccess: true,
          emailVerified: true,
          signupRole: verifiedSignup.role,
          signupCode: verifiedSignup.role === 'TEACHER'
            ? verifiedSignup.teacherCode
            : verifiedSignup.studentCode,
        },
      })
    } catch (requestError) {
      setVerificationError(requestError.response?.data?.message || 'Không thể xác nhận email. Vui lòng thử lại.')
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendMutation.isPending) return
    setVerificationNotice('')
    setVerificationError('')
    try {
      const result = await resendMutation.mutateAsync({ email: verificationEmail })
      setVerificationNotice(result.message || 'Nếu email chưa được xác nhận, mã mới sẽ được gửi.')
      setResendCooldown(60)
    } catch (requestError) {
      setVerificationError(requestError.response?.data?.message || 'Không thể gửi lại mã xác nhận. Vui lòng thử lại.')
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
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-green-700"
          >
            <ArrowLeft size={17} />
            Quay lại trang chủ
          </Link>

          <div className="mb-7 text-center">
            <h1 className="text-3xl font-bold text-[#18301D]">
              {editingPending ? 'Cập nhật thông tin đăng ký' : 'Đăng ký tài khoản'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {editingPending ? 'Xác nhận bằng mật khẩu hiện tại để cập nhật email nhận mã OTP.' : 'Điền thông tin để đăng ký tài khoản mới.'}
            </p>
          </div>

          {verificationPending ? (
            <section className="space-y-5" aria-labelledby="verify-email-title">
              <button type="button" onClick={() => { setEditingPending(true); setVerificationPending(false); setVerificationNotice(''); setError('') }} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-green-700">
                <ArrowLeft size={17} />Quay lại thông tin đăng ký
              </button>
              <div className="text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                  <CheckCircle2 size={28} />
                </span>
                <h2 id="verify-email-title" className="text-xl font-bold text-[#18301D]">Xác nhận email của bạn</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Mã gồm 6 chữ số đã được gửi tới <strong className="text-gray-700">{verificationEmail}</strong>. Mã có hiệu lực trong 10 phút.
                </p>
              </div>
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <label htmlFor="signup-verification-code" className="block text-sm font-semibold text-gray-700">Mã xác nhận</label>
                <input
                  id="signup-verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) => {
                    setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                    setVerificationError('')
                  }}
                  placeholder="Nhập mã 6 chữ số"
                  aria-describedby={verificationError ? 'signup-verification-error' : undefined}
                  className="w-full rounded-xl border border-green-100 bg-white px-4 py-3.5 text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
                {verificationError && <p id="signup-verification-error" role="alert" className="text-sm text-red-600">{verificationError}</p>}
                {verificationNotice && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{verificationNotice}</p>}
                <button type="submit" disabled={verificationMutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {verificationMutation.isPending && <FrogLoading compact label="" />}
                  {verificationMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận email'}
                </button>
              </form>
              <div className="text-center text-sm text-gray-500">
                Chưa nhận được mã?{' '}
                <button type="button" disabled={resendCooldown > 0 || resendMutation.isPending} onClick={handleResendCode} className="font-semibold text-green-700 hover:text-green-800 disabled:cursor-not-allowed disabled:text-gray-400">
                  {resendMutation.isPending ? 'Đang gửi...' : resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã'}
                </button>
              </div>
            </section>
          ) : (
            <>
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-green-50 p-1.5">
            <button
              type="button"
              disabled={editingPending}
              onClick={() => setRole('STUDENT')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
              disabled={editingPending}
              onClick={() => setRole('TEACHER')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                role === 'TEACHER'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <School size={18} />
              Giáo viên
            </button>
          </div>

          <div className="mb-7 text-center">
            {editingPending && <p className="mb-2 text-sm font-semibold text-amber-700">Bạn đang sửa đăng ký chưa xác nhận</p>}
          </div>
          <form onSubmit={editingPending ? handleUpdatePendingSignup : handleSubmit} className="space-y-4">
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
                placeholder={editingPending ? 'Mật khẩu mới *' : 'Mật khẩu *'}
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
            {editingPending && (
              <div>
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value)
                    setFieldErrors((current) => ({ ...current, currentPassword: '' }))
                  }}
                  placeholder="Mật khẩu hiện tại để xác nhận *"
                  className={`w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-green-100 ${fieldErrors.currentPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-green-100 focus:border-green-500'}`}
                />
                {fieldErrors.currentPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.currentPassword}</p>}
              </div>
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
              {loading && <FrogLoading compact label="" className="" />}
              {loading ? editingPending ? 'Đang lưu...' : 'Đang đăng ký...' : editingPending ? 'Lưu thông tin & quay lại OTP' : 'Đăng ký'}
            </button>
          </form>

          {!editingPending && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                HOẶC
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <GoogleAuthButton intent="signup" role={role} />
            </>
          )}

          {editingPending ? (
            <button type="button" onClick={() => { setEditingPending(false); setVerificationPending(true); setCurrentPassword(''); setError('') }} className="mt-6 w-full text-center text-sm font-semibold text-green-700 hover:text-green-800">
              Quay lại nhập mã OTP
            </button>
          ) : (
          <p className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-semibold text-green-700 hover:text-green-800"
            >
              Đăng nhập
            </Link>
          </p>
          )}
            </>
          )}
        </div>
      </section>
      </div>
    </div>
  )
}

export default SignupPage
