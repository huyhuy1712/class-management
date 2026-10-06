import { create } from 'zustand'

const getStoredUser = () => {
  const user = localStorage.getItem('user')

  return user ? JSON.parse(user) : null
}

const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: null,

  setAuth: (user) => {
    localStorage.removeItem('accessToken')
    localStorage.setItem('user', JSON.stringify(user))

    set({
      user,
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