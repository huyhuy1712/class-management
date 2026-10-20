import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import { getGoogleSession } from '../../services/authService'
import FrogLoading from '../../utils/FrogLoading'

const statusMessages = {
  linked: 'Đã liên kết tài khoản Google thành công.',
  account_not_linked: 'Tài khoản Google này chưa được liên kết. Hãy đăng nhập bằng mật khẩu, sau đó liên kết Google trong trang hồ sơ.',
  account_requires_link: 'Email này đã có tài khoản. Hãy đăng nhập bằng mật khẩu rồi liên kết Google trong trang hồ sơ.',
  account_pending: 'Tài khoản giáo viên đang chờ quản trị viên phê duyệt.',
  account_banned: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
  account_in_use: 'Tài khoản hiện đang được quản trị viên truy cập. Vui lòng thử lại sau.',
  google_already_linked: 'Tài khoản Google này đã được liên kết với một tài khoản khác.',
  account_already_linked: 'Tài khoản FrogH đã liên kết với một tài khoản Google khác.',
  link_requires_login: 'Vui lòng đăng nhập trước khi liên kết Google.',
  email_unverified: 'Google không xác nhận email này. Hãy thử một tài khoản Google đã xác minh email.',
  signup_role_missing: 'Không xác định được vai trò đăng ký. Hãy quay lại trang đăng ký và thử lại.',
  account_unavailable: 'Không tìm thấy tài khoản FrogH tương ứng.',
  oauth_failed: 'Đăng nhập Google không thành công. Vui lòng thử lại.',
}

function getRolePath(role) {
  if (role === 'TEACHER') return '/teacher'
  if (role === 'STUDENT') return '/student'
  if (role === 'ADMIN') return '/admin'
  return '/'
}

function GoogleOAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const status = searchParams.get('status') || 'oauth_failed'
  const returnTo = searchParams.get('returnTo')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(status === 'login')

  useEffect(() => {
    if (status !== 'login') return undefined
    let active = true
    getGoogleSession()
      .then((user) => {
        if (!active) return
        setAuth(user)
        navigate(getRolePath(user.role), { replace: true })
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || 'Không thể tải phiên đăng nhập. Vui lòng thử lại.')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [navigate, setAuth, status])

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center"><FrogLoading label="Đang hoàn tất đăng nhập..." /></main>
  }

  const message = error || statusMessages[status] || 'Không thể hoàn tất đăng nhập Google.'
  const linked = status === 'linked'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5FAF4] p-5">
      <section className="w-full max-w-lg rounded-3xl border border-green-100 bg-white p-8 text-center shadow-sm">
        <h1 className={`text-xl font-bold ${linked ? 'text-green-700' : 'text-[#18301D]'}`}>
          {linked ? 'Liên kết thành công' : 'Chưa thể đăng nhập'}
        </h1>
        <p role={linked ? 'status' : 'alert'} className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        <div className="mt-6 flex flex-col gap-3">
          {linked && returnTo && (
            <Link to={returnTo} className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700">
              Quay lại hồ sơ
            </Link>
          )}
          {!linked && (
            <Link to="/login" className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700">
              Đến đăng nhập
            </Link>
          )}
          {!linked && (
            <Link to="/signup" className="font-semibold text-green-700 hover:text-green-800">
              Đến đăng ký
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}

export default GoogleOAuthCallbackPage
