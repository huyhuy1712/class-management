import { Menu, X } from 'lucide-react'
import logo from '../../../assets/logos/logo.png'

interface Props {
  mobileMenuOpen: boolean
  onMenuToggle: () => void
  onNavigate: (path: string) => void
  onScroll: (section: string) => void
}

export default function LandingHeader({ mobileMenuOpen, onMenuToggle, onNavigate, onScroll }: Props) {
  const links = [
    ['Trang chủ', 'top'],
    ['Tính năng', 'features-section'],
    ['Tra cứu', 'lookup-section'],
    ['Về chúng tôi', 'about-footer'],
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <button type="button" onClick={() => onScroll('top')} className="flex items-center gap-3 text-left transition hover:opacity-90">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] p-1.5 shadow-sm ring-1 ring-[#10B981]/20">
            <img src={logo} alt="FrogH Education" className="h-full w-full object-contain" />
          </div>
          <div>
            <span className="block text-lg font-extrabold tracking-tight text-[#0F3822]">FrogH Education</span>
            <span className="block text-xs font-medium text-[#10B981]">Smart Class Management</span>
          </div>
        </button>

        <nav className="hidden items-center gap-1 md:flex lg:gap-2">
          {links.map(([label, section]) => (
            <button key={section} type="button" onClick={() => onScroll(section)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#0F3822]/80 transition hover:bg-[#D8F3DC]/60 hover:text-[#0F3822]">
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button type="button" onClick={() => onNavigate('/login')} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-[#0F3822]">Đăng nhập</button>
          <button type="button" onClick={() => onNavigate('/signup')} className="rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-5 py-2.5 text-sm font-semibold text-white">Đăng ký</button>
        </div>

        <button type="button" aria-label="Mở menu điều hướng" onClick={onMenuToggle} className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/10 text-[#0F3822] md:hidden">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-emerald-900/10 bg-white px-4 py-4 shadow-lg md:hidden">
          <div className="flex flex-col space-y-1.5">
            {links.map(([label, section]) => (
              <button key={section} type="button" onClick={() => onScroll(section)} className="rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-[#0F3822] hover:bg-[#D8F3DC]/50">{label}</button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-emerald-900/10 pt-4">
            <button type="button" onClick={() => onNavigate('/login')} className="rounded-xl border border-emerald-200 py-2.5 text-sm font-semibold text-[#0F3822]">Đăng nhập</button>
            <button type="button" onClick={() => onNavigate('/signup')} className="rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white">Đăng ký</button>
          </div>
        </div>
      )}
    </header>
  )
}
