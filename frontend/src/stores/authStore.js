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

const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: null,

  setAuth: (user) => {
    const normalizedUser = {
      ...user,
      role: normalizeRole(user?.role),
    }

    localStorage.removeItem('accessToken')
    localStorage.setItem('user', JSON.stringify(normalizedUser))

    set({
      user: normalizedUser,
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
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')

    set({
      user: null,
      token: null,
    })
  },
}))

export default useAuthStore