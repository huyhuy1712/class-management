import { useState } from 'react'

import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    </div>
  )
}

export default DashboardLayout
