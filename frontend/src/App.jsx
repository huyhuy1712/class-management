import AppRoutes from './routes/AppRoutes'
import ScrollButtons from './components/common/ScrollButtons'
import ImpersonationBanner from './components/dashboard/ImpersonationBanner'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './stores/authStore'

function App() {
  const location = useLocation()
  const isAuthPage = ['/login', '/signup'].includes(location.pathname)

  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === null || ['user', 'impersonationAdmin'].includes(event.key)) {
        useAuthStore.getState().syncAuthFromStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <>
      <ImpersonationBanner />
      <AppRoutes />
      {!isAuthPage && <ScrollButtons />}
    </>
  )
}

export default App