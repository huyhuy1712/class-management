import api from './api'

export const login = async (data) => {
  const response = await api.post('/auth/login', data)
  return response.data
}

export const signup = async (data) => {
  const response = await api.post('/auth/signup', data)
  return response.data
}

export const verifyEmail = async (data) => {
  const response = await api.post('/auth/verify-email', data)
  return response.data
}

export const resendEmailVerificationCode = async (data) => {
  const response = await api.post('/auth/resend-verification-code', data)
  return response.data
}

export const updatePendingSignup = async (data) => {
  const response = await api.put('/auth/signup/pending', data)
  return response.data
}

export const requestPasswordReset = async (data) => {
  const response = await api.post('/auth/password-reset/request', data)
  return response.data
}

export const verifyPasswordResetCode = async (data) => {
  const response = await api.post('/auth/password-reset/verify', data)
  return response.data
}

export const completePasswordReset = async (data) => {
  const response = await api.post('/auth/password-reset/complete', data)
  return response.data
}

export const getPasswordRecoveryContact = async () => {
  const response = await api.get('/auth/password-reset/contact')
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