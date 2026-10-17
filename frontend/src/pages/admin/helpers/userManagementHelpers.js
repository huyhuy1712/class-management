export const statusLabels = {
  ACTIVE: 'Hoạt động',
  PENDING: 'Chờ duyệt',
  BANNED: 'Đã khóa',
}

export const emptyUserForm = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  role: 'STUDENT',
  status: 'ACTIVE',
  password: '',
}

export function createUserForm(user) {
  if (!user) return { ...emptyUserForm }

  return {
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone ?? '',
    role: user.role,
    status: user.status,
    password: '',
  }
}

export function getRoleLabel(role) {
  if (role === 'STUDENT') return 'Học sinh'
  if (role === 'TEACHER') return 'Giáo viên'
  return role
}

export function filterUsers(users, keyword, roleFilter, statusFilter) {
  const normalizedKeyword = keyword.trim().toLowerCase()

  return users.filter((user) => {
    const matchesKeyword = [user.name, user.username, user.email]
      .some((value) => String(value ?? '').toLowerCase().includes(normalizedKeyword))
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter

    return matchesKeyword && matchesRole && matchesStatus
  })
}
