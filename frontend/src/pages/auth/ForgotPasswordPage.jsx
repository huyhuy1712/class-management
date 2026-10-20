import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye, EyeOff, Leaf, Sprout, Trees, BookOpen, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import FrogLoading from '../../utils/FrogLoading'
import {
  completePasswordReset,
  getPasswordRecoveryContact,
  requestPasswordReset,
  verifyPasswordResetCode,
} from '../../services/authService'
import logo from '../../assets/logos/logo.png'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const requestMutation = useMutation({ mutationFn: requestPasswordReset })
  const verifyMutation = useMutation({ mutationFn: verifyPasswordResetCode })
  const completeMutation = useMutation({ mutationFn: completePasswordReset })
  const contactQuery = useQuery({
    queryKey: ['password-recovery-contact'],
    queryFn: getPasswordRecoveryContact,
    enabled: step === 'support',
    staleTime: 5 * 60 * 1000,
  })

  const handleRequestCode = async (event) => {
    event.preventDefault()
    if (requestMutation.isPending) return
    setError('')
    try {
      await requestMutation.mutateAsync({ email: email.trim() })
      setStep('code')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.')
    }
  }

  const handleVerifyCode = async (event) => {
    event.preventDefault()
    if (verifyMutation.isPending) return
    if (!/^\d{6}$/.test(code)) {
      setError('Mã xác nhận phải gồm 6 chữ số.')
      return
    }
    setError('')
    try {
      const result = await verifyMutation.mutateAsync({ email: email.trim(), code })
      setResetToken(result.resetToken)
      setStep('password')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xác minh mã. Vui lòng kiểm tra lại.')
    }
  }

  const handleCompleteReset = async (event) => {
    event.preventDefault()
    if (completeMutation.isPending) return
    if (newPassword.length < 8 || newPassword.length > 100) {
      setError('Mật khẩu mới phải có từ 8 đến 100 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setError('')
    try {
      await completeMutation.mutateAsync({
        email: email.trim(),
        resetToken,
        newPassword,
        confirmPassword,
      })
      setResetToken('')
      setNewPassword('')
      setConfirmPassword('')
      setStep('done')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng xác minh OTP lại.')
    }
  }

  const isPending = requestMutation.isPending || verifyMutation.isPending || completeMutation.isPending

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
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center gap-3 px-6 pt-6 sm:px-10 sm:pt-9">
        <img src={logo} alt="Class Management" className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
        <div>
          <p className="text-xl font-bold text-[#18301D]">FrogH</p>
          <p className="text-sm text-green-700">Education System</p>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <section className="login-card w-full max-w-[460px] rounded-[28px] border border-green-100 bg-white px-6 py-8 sm:px-9 sm:py-10">
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-green-700"
          >
            <ArrowLeft size={17} />
            Quay lại đăng nhập
          </Link>

          <div className="mb-7 text-center">
            <h1 className="text-3xl font-bold text-[#18301D]">
              {step === 'done' ? 'Đã đổi mật khẩu' : step === 'support' ? 'Liên hệ quản trị viên' : 'Quên mật khẩu'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {step === 'email' && 'Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.'}
              {step === 'code' && `Nếu email thuộc tài khoản hợp lệ, mã xác nhận đã được gửi tới ${email}.`}
              {step === 'password' && 'Tạo mật khẩu mới để hoàn tất khôi phục tài khoản.'}
              {step === 'done' && 'Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.'}
              {step === 'support' && 'Bạn có thể nhờ quản trị viên hỗ trợ khôi phục tài khoản.'}
            </p>
          </div>

          {step === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-gray-700">Email đăng ký</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full rounded-xl border border-green-100 bg-white px-4 py-3.5 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </div>
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestMutation.isPending && <FrogLoading compact label="" />}
                {requestMutation.isPending ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}
              </button>
              <button type="button" onClick={() => { setError(''); setStep('support') }} className="w-full text-sm font-semibold text-green-700 hover:text-green-800">
                Thử cách khác
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label htmlFor="reset-code" className="mb-2 block text-sm font-semibold text-gray-700">Mã OTP</label>
                <input
                  id="reset-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Nhập mã 6 chữ số"
                  className="w-full rounded-xl border border-green-100 bg-white px-4 py-3.5 text-center text-lg tracking-[0.4em] outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </div>
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
                {verifyMutation.isPending && <FrogLoading compact label="" />}
                {verifyMutation.isPending ? 'Đang xác minh...' : 'Xác minh OTP'}
              </button>
              <button type="button" onClick={() => { setError(''); setStep('email') }} className="w-full text-sm font-semibold text-green-700 hover:text-green-800">
                Đổi email
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleCompleteReset} className="space-y-5">
              <div>
                <label htmlFor="reset-new-password" className="mb-2 block text-sm font-semibold text-gray-700">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-green-100 bg-white px-4 py-3.5 pr-12 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                  <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="reset-confirm-password" className="mb-2 block text-sm font-semibold text-gray-700">Nhập lại mật khẩu mới</label>
                <div className="relative">
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-green-100 bg-white px-4 py-3.5 pr-12 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                  <button type="button" aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'} onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
                {completeMutation.isPending && <FrogLoading compact label="" />}
                {completeMutation.isPending ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div role="status" className="space-y-5">
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                Đổi mật khẩu thành công. Bạn có thể quay lại trang đăng nhập.
              </p>
              <button type="button" onClick={() => navigate('/login', { replace: true })} className="w-full rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700">
                Về trang đăng nhập
              </button>
            </div>
          )}

          {step === 'support' && (
            <div className="space-y-5">
              {contactQuery.isPending && <FrogLoading label="Đang tải thông tin liên hệ..." />}
              {contactQuery.isError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">Không thể tải thông tin liên hệ. Vui lòng thử lại.</p>}
              {contactQuery.data && (
                <div className="space-y-3 rounded-xl bg-green-50 p-4 text-sm text-gray-700">
                  <p><strong>Email:</strong> {contactQuery.data.email || 'Chưa được cấu hình'}</p>
                  <p><strong>Số điện thoại:</strong> {contactQuery.data.phone || 'Chưa được cấu hình'}</p>
                </div>
              )}
              <button type="button" onClick={() => { setError(''); setStep('email') }} className="w-full rounded-xl border border-green-200 py-3 font-semibold text-green-700 hover:bg-green-50">
                Quay lại nhập email
              </button>
            </div>
          )}

          <p className="mt-7 text-center text-sm text-gray-500">
            <Link to="/login" className="font-semibold text-green-700 hover:text-green-800">Quay về đăng nhập</Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export default ForgotPasswordPage
