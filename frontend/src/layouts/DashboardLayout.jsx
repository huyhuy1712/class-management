import { useState } from 'react'

import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5FAF4]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="mx-auto max-w-[1600px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout