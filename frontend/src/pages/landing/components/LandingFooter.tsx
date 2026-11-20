import logo from '../../../assets/logos/logo.png'

interface Props {
  onNavigate: (path: string) => void
  onScroll: (section: string) => void
}

export default function LandingFooter({ onNavigate, onScroll }: Props) {
  return (
    <footer id="about-footer" className="border-t border-emerald-900/10 bg-[#0F3822] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] p-1.5"><img src={logo} alt="FrogH Education" className="h-full w-full object-contain" /></div><h3 className="text-lg font-extrabold">FrogH Education System</h3></div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#D8F3DC]/80">Nền tảng hỗ trợ giảng viên và học sinh tối ưu hóa quy trình quản lý lớp học, điểm danh và đánh giá năng lực.</p>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#D8F3DC]">Liên kết nhanh</h4>
            <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/80">
              <button type="button" onClick={() => onScroll('top')} className="text-left hover:text-[#D8F3DC]">Trang chủ</button>
              <button type="button" onClick={() => onScroll('lookup-section')} className="text-left hover:text-[#D8F3DC]">Tra cứu kết quả học tập</button>
              <button type="button" onClick={() => onScroll('features-section')} className="text-left hover:text-[#D8F3DC]">Tính năng nổi bật</button>
              <button type="button" onClick={() => onNavigate('/login')} className="text-left hover:text-[#D8F3DC]">Đăng nhập hệ thống</button>
            </div>
          </div>
          <div className="md:col-span-4"><h4 className="text-sm font-bold uppercase tracking-wider text-[#D8F3DC]">Ghi chú đồ án</h4><p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-[#D8F3DC]/90">Ứng dụng kiến trúc Spring Boot RESTful API kết hợp React + Tailwind CSS theo chuẩn Design System FrogH Education.</p></div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-[#D8F3DC]/70">© {new Date().getFullYear()} FrogH Education System. All rights reserved.</div>
      </div>
    </footer>
  )
}
