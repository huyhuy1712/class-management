import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { stopImpersonation } from '../../services/authService'
import useAuthStore from '../../stores/authStore'

export default function ImpersonationBanner() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const admin = useAuthStore((state) => state.impersonationAdmin)
  const restoreAdmin = useAuthStore((state) => state.restoreImpersonationAdmin)

  const stopMutation = useMutation({
    mutationFn: stopImpersonation,
    onSuccess: () => {
      restoreAdmin()
      navigate('/admin', { replace: true })
    },
  })

  if (!admin) return null

  return (
    <div className="impersonation-banner" role="status">
      <div>
        <strong>Đang mạo danh tài khoản</strong>
        <span>{user?.fullName || user?.username} · {user?.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</span>
      </div>
      <button
        type="button"
        onClick={() => stopMutation.mutate()}
        disabled={stopMutation.isPending}
      >
        {stopMutation.isPending ? 'Đang quay lại...' : 'Thoát mạo danh'}
      </button>
      {stopMutation.isError && (
        <span className="impersonation-banner__error" role="alert">
          Không thể thoát phiên. Vui lòng thử lại.
        </span>
      )}
    </div>
  )
}
