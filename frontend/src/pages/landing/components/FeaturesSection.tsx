import { BarChart3, BookOpen, ShieldCheck, UserCheck } from 'lucide-react'

const features = [
  ['Real-time Attendance', 'Điểm danh thời gian thực', 'Khởi tạo phiên điểm danh nhanh chóng theo từng ca học với mã bảo mật riêng biệt.', UserCheck],
  ['Smart Exam Builder', 'Đề thi & Kiểm tra Wizard', 'Trình tạo đề thi trực tuyến hỗ trợ nhiều loại câu hỏi, LaTeX và chấm điểm linh hoạt.', BookOpen],
  ['Transparent Analytics', 'Bảng điểm & Thống kê minh bạch', 'Theo dõi tiến độ học tập, chuyên cần và kết quả đánh giá minh bạch.', BarChart3],
]

export default function FeaturesSection() {
  return (
    <section id="features-section" className="scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <span className="rounded-full bg-[#D8F3DC] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F3822]">Thế mạnh cốt lõi</span>
          <h2 className="mt-3 text-2xl font-extrabold text-[#0F3822] sm:text-3xl">Tính năng nổi bật của hệ thống FrogH</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map(([eyebrow, title, description, Icon]) => (
            <article key={title as string} className="rounded-2xl border border-emerald-900/10 bg-white p-7 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#0F3822]"><Icon size={26} /></div>
              <span className="mt-5 inline-block rounded-full bg-[#F8FAF9] px-3 py-1 text-xs font-semibold text-[#10B981]">{eyebrow as string}</span>
              <h3 className="mt-3 text-xl font-bold text-[#0F3822]">{title as string}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-gray-600">{description as string}</p>
              <div className="mt-6 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs font-medium text-[#0F3822]/80"><ShieldCheck size={15} className="text-[#10B981]" /> Theo dõi dữ liệu minh bạch</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
