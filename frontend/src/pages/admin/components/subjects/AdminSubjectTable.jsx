import { Pencil, Trash2 } from 'lucide-react'

export default function AdminSubjectTable({
  subjects,
  totalSubjects,
  isPending,
  error,
  deletePending,
  onEdit,
  onDelete,
}) {
  return (
    <div className="admin-table-wrapper">
      <table className="admin-user-table">
        <thead>
          <tr>
            <th>TÊN MÔN HỌC</th>
            <th>MÃ MÔN HỌC</th>
            <th>MÔ TẢ</th>
            <th>THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {isPending && <tr><td colSpan={4}>Đang tải dữ liệu môn học...</td></tr>}
          {!isPending && subjects.map((subject) => (
            <tr key={subject.id}>
              <td><strong>{subject.name}</strong></td>
              <td><span className="admin-username">{subject.code}</span></td>
              <td className="admin-subject-description">{subject.description || '—'}</td>
              <td>
                <div className="admin-table-actions">
                  <button
                    type="button"
                    className="admin-icon-btn edit"
                    title="Chỉnh sửa"
                    aria-label={`Sửa môn ${subject.name}`}
                    onClick={() => onEdit(subject)}
                  >
                    <Pencil size={17} strokeWidth={2} />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn delete"
                    title="Xóa môn học"
                    aria-label={`Xóa môn ${subject.name}`}
                    disabled={deletePending}
                    onClick={() => onDelete(subject)}
                  >
                    <Trash2 size={17} strokeWidth={2} />
                    <span>Xóa</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!isPending && !error && subjects.length === 0 && (
            <tr>
              <td colSpan={4}>
                <div className="admin-no-results">
                  <span>⌕</span>
                  <strong>{totalSubjects ? 'Không tìm thấy môn học' : 'Chưa có môn học'}</strong>
                  <p>{totalSubjects ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Thêm môn học để bắt đầu quản lý.'}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
