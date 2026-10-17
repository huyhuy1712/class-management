export default function AdminUserFilters({
  keyword,
  onKeywordChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <div className="admin-user-filters">
      <div className="admin-search">
        <span>⌕</span>
        <input
          type="search"
          placeholder="Tìm theo tên, username hoặc email..."
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
      </div>
      <select aria-label="Lọc theo vai trò" value={roleFilter} onChange={(event) => onRoleFilterChange(event.target.value)}>
        <option value="ALL">Tất cả vai trò</option>
        <option value="STUDENT">Học sinh</option>
        <option value="TEACHER">Giáo viên</option>
      </select>
      <select aria-label="Lọc theo trạng thái" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
        <option value="ALL">Tất cả trạng thái</option>
        <option value="ACTIVE">Hoạt động</option>
        <option value="PENDING">Chờ duyệt</option>
        <option value="BANNED">Đã khóa</option>
      </select>
    </div>
  )
}
