import { useEffect, useState } from 'react'
import api from '../../services/api'

function getBackendOrigin() {
  const configuredApiUrl = api.defaults.baseURL
  if (!configuredApiUrl) {
    throw new Error('Chưa cấu hình địa chỉ API backend.')
  }

  const apiUrl = new URL(configuredApiUrl, window.location.origin)
  const backendBasePath = apiUrl.pathname.replace(/\/api\/?$/, '').replace(/\/$/, '')
  return `${apiUrl.origin}${backendBasePath}`
}

function GoogleAuthButton({ intent = 'login', role, returnTo, className = '' }) {
  const [enabled, setEnabled] = useState(false)
  const [linked, setLinked] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/auth/google/enabled')
      .then(({ data }) => {
        if (active) setEnabled(data.enabled === true)
      })
      .catch((requestError) => {
        if (active) {
          setEnabled(false)
          setError(requestError.response?.data?.message || 'Không thể kết nối backend để kiểm tra đăng nhập Google.')
        }
      })

    if (intent === 'link') {
      api.get('/auth/google/linked')
        .then(({ data }) => {
          if (active) setLinked(data.linked === true)
        })
        .catch((requestError) => {
          if (active) {
            setLinked(false)
            setError(requestError.response?.data?.message || 'Không thể kiểm tra trạng thái liên kết Google.')
          }
        })
    }

    return () => {
      active = false
    }
  }, [intent])

  if (error) {
    return (
      <p role="alert" className={`text-center text-sm text-red-600 ${className}`}>
        {error}
      </p>
    )
  }

  if (!enabled) return null

  if (intent === 'link' && linked) {
    return (
      <div role="status" className={`rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800 ${className}`}>
        Đã liên kết tài khoản Google
      </div>
    )
  }

  const startGoogleAuth = () => {
    try {
      const url = new URL(`${getBackendOrigin()}/oauth2/authorization/google`)
      url.searchParams.set('intent', intent)
      if (intent === 'signup' && role) url.searchParams.set('role', role)
      if (intent === 'link' && returnTo) url.searchParams.set('returnTo', returnTo)
      window.location.assign(url.toString())
    } catch (requestError) {
      setError(requestError.message || 'Không thể bắt đầu đăng nhập Google.')
    }
  }

  return (
    <button
      type="button"
      onClick={startGoogleAuth}
      className={`flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50 ${className}`}
    >
      <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.1 5.1 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.85 0-5.27-1.92-6.13-4.5H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.87 14.13A6.6 6.6 0 0 1 5.52 12c0-.74.13-1.45.35-2.13V7.03H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.97l3.69-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.73 1 4.03 3.44 2.18 7.03l3.69 2.84c.86-2.58 3.28-4.49 6.13-4.49Z" />
      </svg>
      {intent === 'link'
        ? 'Liên kết tài khoản Google'
        : intent === 'signup' ? 'Đăng ký bằng Google' : 'Đăng nhập bằng Google'}
    </button>
  )
}

export default GoogleAuthButton
