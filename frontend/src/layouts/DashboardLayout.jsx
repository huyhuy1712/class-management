import { useEffect, useState } from 'react'

import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'
import AiChatWidget from '../components/AiChatWidget'
import { useNavigate } from 'react-router-dom'

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [limitMessage, setLimitMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleLimitReached = (event) => {
      setLimitMessage(event.detail?.message || 'Bạn đã đạt giới hạn của gói miễn phí.')
    }
    window.addEventListener('free-tier-limit', handleLimitReached)
    return () => window.removeEventListener('free-tier-limit', handleLimitReached)
  }, [])

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F4F6F8]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen min-w-0 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="mx-auto min-w-0 w-full max-w-[1600px] pb-12 pt-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Trợ lý Học tập AI dành cho Giáo viên */}
      <AiChatWidget />

      {limitMessage && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setLimitMessage('')
      }}>
        <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="free-tier-limit-title">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">!</div>
          <h2 id="free-tier-limit-title" className="mt-4 text-xl font-bold text-slate-900">Đã đạt giới hạn gói miễn phí</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{limitMessage}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setLimitMessage('')} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Để sau</button>
            <button type="button" onClick={() => { setLimitMessage(''); navigate('/teacher/billing') }} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Nâng cấp VIP</button>
          </div>
        </section>
      </div>}
    </div>
  )
}

export default DashboardLayout
