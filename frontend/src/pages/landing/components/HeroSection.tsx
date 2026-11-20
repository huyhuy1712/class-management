import { ArrowRight, BarChart3, CheckCircle2, FileCheck2, GraduationCap, QrCode, Sparkles } from 'lucide-react'

interface Props {
  onLookup: () => void
  onLogin: () => void
}

export default function HeroSection({ onLookup, onLogin }: Props) {
  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-12">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3822] via-[#134E2E] to-[#10B981] px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#D8F3DC]/10 blur-2xl" />
          <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D8F3DC]/30 bg-[#D8F3DC]/15 px-4 py-1.5 text-sm font-semibold text-[#D8F3DC]">
                <Sparkles size={15} /> Nền tảng Giáo dục Số Thế hệ mới
              </div>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Hệ thống Quản lý Đào tạo &amp; Giảng dạy FrogH</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#D8F3DC]/90 sm:text-lg">Giải pháp số hóa toàn diện giúp giảng viên và học sinh quản lý lớp học thông minh, điểm danh trực tuyến và tổ chức kiểm tra minh bạch.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button type="button" onClick={onLookup} className="inline-flex items-center gap-2.5 rounded-xl bg-[#D8F3DC] px-6 py-3.5 text-sm font-bold text-[#0F3822]"><span>Tra cứu kết quả ngay</span><ArrowRight size={18} /></button>
                <button type="button" onClick={onLogin} className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white">Vào cổng đào tạo</button>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md sm:p-6">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div className="flex items-center gap-3"><GraduationCap size={22} /><p className="text-sm font-bold">Cổng thông tin Học vụ</p></div>
                  <span className="rounded-full bg-[#10B981] px-3 py-1 text-xs font-bold">Trực tuyến</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[[QrCode, 'Điểm danh buổi học'], [FileCheck2, 'Làm bài thi & chấm tự động'], [BarChart3, 'Theo dõi chuyên cần & bảng điểm']].map(([Icon, label]) => (
                    <div key={label as string} className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"><div className="flex items-center gap-3"><Icon size={18} /><span className="text-sm font-medium">{label as string}</span></div><CheckCircle2 size={18} /></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
