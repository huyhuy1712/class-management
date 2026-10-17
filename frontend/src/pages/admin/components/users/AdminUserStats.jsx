import { GraduationCap, Presentation, UsersRound } from 'lucide-react'
import FrogLoading from '../../../../utils/FrogLoading'

export default function AdminUserStats({ isPending, users, studentCount, teacherCount }) {
  return (
    <div className="admin-stats admin-users-stats">
      <div className="admin-stat-card">
        <div className="admin-stat-card__icon blue"><UsersRound size={21} strokeWidth={1.8} /></div>
        <span>Tổng tài khoản</span>
        <strong>{isPending ? <FrogLoading compact label="" /> : users.length}</strong>
        <small>Học sinh và giáo viên</small>
      </div>
      <div className="admin-stat-card">
        <div className="admin-stat-card__icon purple"><GraduationCap size={21} strokeWidth={1.8} /></div>
        <span>Học sinh</span>
        <strong>{isPending ? <FrogLoading compact label="" /> : studentCount}</strong>
        <small>Tài khoản học sinh</small>
      </div>
      <div className="admin-stat-card">
        <div className="admin-stat-card__icon orange"><Presentation size={21} strokeWidth={1.8} /></div>
        <span>Giáo viên</span>
        <strong>{isPending ? <FrogLoading compact label="" /> : teacherCount}</strong>
        <small>Tài khoản giáo viên</small>
      </div>
    </div>
  )
}
