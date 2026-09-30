import AppRoutes from './routes/AppRoutes'
import ScrollButtons from './components/common/ScrollButtons'
import { useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()
  const isAuthPage = ['/login', '/signup'].includes(location.pathname)

  return (
    <>
      <AppRoutes />
      {!isAuthPage && <ScrollButtons />}
    </>
  )
}

export default App