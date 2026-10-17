import { useQuery } from '@tanstack/react-query'
import { GraduationCap, Presentation, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import adminService from '../../services/adminService'
import FrogLoading from '../../utils/FrogLoading'

export default function AdminDashboard() {
  const { data, isPending, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: adminService.getDashboard,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })

  return (
    <div className="admin-dashboard">
      <div className="admin-welcome">
        <div>
          <span className="admin-eyebrow">ADMINISTRATION</span>
          <h2>Chào mừng trở lại!</h2>
          <p>Quản lý tài khoản và theo dõi hệ thống lớp học.</p>
        </div>

        <Link className="admin-primary-btn" to="/admin/users">
          Xem tài khoản
        </Link>
      </div>

      {error && (
        <p className="admin-data-error" role="alert">
          Không thể tải số liệu quản trị. Vui lòng tải lại trang hoặc đăng nhập lại.
        </p>
      )}

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon blue"><UsersRound size={21} strokeWidth={1.8} /></div>
          <span>Tổng tài khoản</span>
          <strong>{isPending ? <FrogLoading compact label="" /> : data?.totalUsers ?? '-'}</strong>
          <small>Toàn bộ tài khoản trong hệ thống</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon purple"><GraduationCap size={21} strokeWidth={1.8} /></div>
          <span>Học sinh</span>
          <strong>{isPending ? <FrogLoading compact label="" /> : data?.studentCount ?? '-'}</strong>
          <small>Tài khoản học sinh</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon orange"><Presentation size={21} strokeWidth={1.8} /></div>
          <span>Giáo viên</span>
          <strong>{isPending ? <FrogLoading compact label="" /> : data?.teacherCount ?? '-'}</strong>
          <small>Tài khoản giáo viên</small>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <h3>Tình trạng tài khoản</h3>
            <p>Số liệu được cập nhật trực tiếp từ cơ sở dữ liệu.</p>
          </div>
          <Link to="/admin/users" className="admin-text-link">
            Danh sách tài khoản →
          </Link>
        </div>

        <div className="admin-dashboard-empty">
          {error ? (
            <>
              <h3>Không tải được dữ liệu</h3>
              <p>Hãy kiểm tra kết nối hoặc phiên đăng nhập của bạn.</p>
            </>
          ) : (
            <>
              {isPending ? (
                <FrogLoading label="Đang tải dữ liệu tài khoản..." />
              ) : (
                <>
                  <h3>Tổng quan trạng thái</h3>
                  <p>
                    Đang chờ duyệt: {data?.pendingCount ?? 0} · Đã khóa: {data?.bannedCount ?? 0}
                  </p>
                  <Link to="/admin/users" className="admin-primary-btn">
                    Mở danh sách tài khoản
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
