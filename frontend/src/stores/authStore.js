import { create } from 'zustand'

const getStoredUser = () => {
  const user = localStorage.getItem('user')

  return user ? JSON.parse(user) : null
}

const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('accessToken'),

  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('user', JSON.stringify(user))

    set({
      user,
      token,
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