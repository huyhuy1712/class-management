import { BookOpen } from 'lucide-react'
import FrogLoading from '../../../../utils/FrogLoading'

export default function AdminSubjectStats({ isPending, count }) {
  return (
    <div className="admin-stats admin-users-stats">
      <div className="admin-stat-card">
        <div className="admin-stat-card__icon blue"><BookOpen size={21} strokeWidth={1.8} /></div>
        <span>Tổng môn học</span>
        <strong>{isPending ? <FrogLoading compact label="" /> : count}</strong>
        <small>Môn học trong hệ thống</small>
      </div>
    </div>
  )
}
