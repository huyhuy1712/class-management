import api from './api'

export const login = async (data) => {
  const response = await api.post('/auth/login', data)
  return response.data
}

export const signup = async (data) => {
  const response = await api.post('/auth/signup', data)
  return response.data
}

export const logout = async () => {
  await api.post('/auth/logout')
}

export const stopImpersonation = async () => {
  await api.post('/auth/impersonation/stop')
}

export const checkImpersonationStatus = async () => {
  const response = await api.get('/auth/impersonation/status')
  return response.data === true
}