import AppRoutes from './routes/AppRoutes'
import ScrollButtons from './components/common/ScrollButtons'
import ImpersonationBanner from './components/dashboard/ImpersonationBanner'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { checkImpersonationStatus } from './services/authService'
import useAuthStore from './stores/authStore'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthPage = ['/login', '/signup'].includes(location.pathname)
  const user = useAuthStore((state) => state.user)
  const impersonationAdmin = useAuthStore((state) => state.impersonationAdmin)
  const logout = useAuthStore((state) => state.logout)
  const isRegularUser = ['STUDENT', 'TEACHER'].includes(user?.role)
  const { data: sessionDisplaced } = useQuery({
    queryKey: ['auth', 'impersonation-status', user?.id],
    queryFn: checkImpersonationStatus,
    enabled: Boolean(user && isRegularUser && !impersonationAdmin),
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  })

  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === 'impersonationLogoutNotice' && event.newValue) {
        useAuthStore.getState().syncAuthFromStorage()
        navigate('/login', {
          replace: true,
          state: { sessionNotice: event.newValue },
        })
        return
      }

      if (event.key === null || ['user', 'impersonationAdmin'].includes(event.key)) {
        useAuthStore.getState().syncAuthFromStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [navigate])

  useEffect(() => {
    if (!sessionDisplaced || !user || impersonationAdmin) return

    const notice = 'Quản trị viên đã truy cập tài khoản của bạn. Phiên đăng nhập đã kết thúc.'
    localStorage.setItem('impersonationLogoutNotice', notice)
    logout()
    navigate('/login', {
      replace: true,
      state: { sessionNotice: notice },
    })
    localStorage.removeItem('impersonationLogoutNotice')
  }, [sessionDisplaced, user, impersonationAdmin, logout, navigate])

  return (
    <>
      <ImpersonationBanner />
      <AppRoutes />
      {!isAuthPage && <ScrollButtons />}
    </>
  )
}

export default App