import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F5FAF4]">
      <Sidebar />

      <div className="ml-64 min-h-screen">
        <Header />

        <main className="mx-auto max-w-[1600px] px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout