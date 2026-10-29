import GoogleAuthButton from '../../../components/auth/GoogleAuthButton'

export default function GoogleSecurityCard({ student }) {
  return (
    <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#18301D]">Đăng nhập và bảo mật</h2>
      <p className="mt-1 text-sm text-gray-500">
        Liên kết Google để lần sau có thể đăng nhập nhanh bằng tài khoản Google của bạn.
      </p>
      <div className="mt-4 max-w-md">
        <GoogleAuthButton
          intent="link"
          returnTo={student ? '/student/profile' : '/teacher/profile'}
        />
      </div>
    </section>
  )
}
