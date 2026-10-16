import { resetQuerySession } from '../query/queryClient'
import { create } from 'zustand'

const normalizeRole = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.trim().toUpperCase()
  if (typeof value === 'object' && value?.name) return String(value.name).trim().toUpperCase()
  return String(value).trim().toUpperCase()
}

const getStoredUser = () => {
  const user = localStorage.getItem('user')

  if (!user) return null

  try {
    const parsedUser = JSON.parse(user)

    if (!parsedUser) return null

    return {
      ...parsedUser,
      role: normalizeRole(parsedUser.role),
    }
  } catch {
    return null
  }
}

const getStoredImpersonationAdmin = () => {
  const admin = localStorage.getItem('impersonationAdmin')
  if (!admin) return null

  try {
    const parsedAdmin = JSON.parse(admin)
    if (!parsedAdmin) return null
    return { ...parsedAdmin, role: normalizeRole(parsedAdmin.role) }
  } catch {
    return null
  }
}

const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  impersonationAdmin: getStoredImpersonationAdmin(),
  token: null,

  setAuth: (user) => {
    resetQuerySession()
    const normalizedUser = {
      ...user,
      role: normalizeRole(user?.role),
    }

    localStorage.removeItem('accessToken')
    localStorage.removeItem('impersonationAdmin')
    localStorage.setItem('user', JSON.stringify(normalizedUser))

    set({
      user: normalizedUser,
      impersonationAdmin: null,
      token: null,
    })
  },

  startImpersonation: (targetUser) => {
    const admin = get().user
    if (admin?.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể bắt đầu impersonation')
    }

    resetQuerySession()
    const normalizedTarget = {
      ...targetUser,
      role: normalizeRole(targetUser?.role),
    }
    localStorage.setItem('impersonationAdmin', JSON.stringify(admin))
    localStorage.setItem('user', JSON.stringify(normalizedTarget))
    set({
      user: normalizedTarget,
      impersonationAdmin: admin,
      token: null,
    })
  },

  restoreImpersonationAdmin: () => {
    const admin = get().impersonationAdmin
    if (!admin) return

    resetQuerySession()
    localStorage.removeItem('impersonationAdmin')
    localStorage.setItem('user', JSON.stringify(admin))
    set({
      user: admin,
      impersonationAdmin: null,
      token: null,
    })
  },

  syncAuthFromStorage: () => {
    resetQuerySession()
    set({
      user: getStoredUser(),
      impersonationAdmin: getStoredImpersonationAdmin(),
      token: null,
    })
  },

  // Cập nhật thông tin user
  updateUser: (updatedUser) => {
    const currentUser = get().user

    if (!currentUser) return

    const newUser = {
      ...currentUser,
      ...updatedUser,
    }

    localStorage.setItem(
      'user',
      JSON.stringify(newUser)
    )

    set({
      user: newUser,
    })
  },

  logout: () => {
    resetQuerySession()
    localStorage.removeItem('accessToken')
    localStorage.removeItem('impersonationAdmin')
    localStorage.removeItem('user')

    set({
      user: null,
      impersonationAdmin: null,
      token: null,
    })
  },
}))

export default useAuthStore