import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  FileCheck2,
  BarChart3,
  QrCode,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  BookOpen,
  GraduationCap,
  X,
  Eye,
  Menu,
  Check,
  Info,
  Award,
  Layers,
} from 'lucide-react'
import logo from '../../assets/logos/logo.png'

interface AbsenceDetail {
  id: string
  sessionNumber: number
  date: string
  timeSlot: string
  topic: string
  status: 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' | 'LATE'
  note: string
}

interface GradeProgressRow {
  id: string
  timestamp: string
  examTitle: string
  multipleChoice: string
  fillInBlank: string
  trueFalse: string
  totalScore: number
  comment: string
}

interface StudentLookupResult {
  studentCode: string
  candidateNumber: string
  fullName: string
  className: string
  absenceCount: number
  totalSessions: number
  attendanceRate: string
  averageScore: number
  rankLabel: string
  absences: AbsenceDetail[]
  grades: GradeProgressRow[]
}

const CLASS_OPTIONS = [
  'Chủ Nghĩa Xã Hội',
  'Hệ thống thông tin 01',
  'Lập trình Java k25',
]

const MOCK_STUDENT_DB: Record<string, Omit<StudentLookupResult, 'className'>> = {
  '3122410142': {
    studentCode: '3122410142',
    candidateNumber: 'SBD-2026-0142',
    fullName: 'Lê Ngọc Anh Huy',
    absenceCount: 2,
    totalSessions: 15,
    attendanceRate: '86.7%',
    averageScore: 8.6,
    rankLabel: 'Giỏi',
    absences: [
      {
        id: 'abs-1',
        sessionNumber: 4,
        date: '14/09/2026',
        timeSlot: 'Ca 1 (07:30 - 09:30)',
        topic: 'Buổi 4: Thảo luận chuyên đề & Bài tập nhóm',
        status: 'ABSENT_EXCUSED',
        note: 'Xin phép nghỉ ốm (Có giấy xác nhận y tế)',
      },
      {
        id: 'abs-2',
        sessionNumber: 9,
        date: '02/10/2026',
        timeSlot: 'Ca 1 (07:30 - 09:30)',
        topic: 'Buổi 9: Ôn tập giữa kỳ & Giải đáp câu hỏi',
        status: 'ABSENT_UNEXCUSED',
        note: 'Vắng không phép (Không nhập mã điểm danh ca học)',
      },
      {
        id: 'abs-3',
        sessionNumber: 12,
        date: '09/10/2026',
        timeSlot: 'Ca 1 (07:30 - 09:30)',
        topic: 'Buổi 12: Kiểm tra tiến độ đồ án thực hành',
        status: 'LATE',
        note: 'Điểm danh trễ 12 phút so với giờ đóng mã chuẩn',
      },
    ],
    grades: [
      {
        id: 'g-1',
        timestamp: '10/09/2026 08:15',
        examTitle: 'Kiểm tra 15 phút - Đợt 1',
        multipleChoice: '4.0 / 4.0',
        fillInBlank: '2.5 / 3.0',
        trueFalse: '2.0 / 3.0',
        totalScore: 8.5,
        comment: 'Nắm vững kiến thức nền tảng, cần chú ý kỹ câu hỏi Đúng/Sai.',
      },
      {
        id: 'g-2',
        timestamp: '24/09/2026 08:30',
        examTitle: 'Kiểm tra quá trình - Đợt 2',
        multipleChoice: '3.5 / 4.0',
        fillInBlank: '2.5 / 3.0',
        trueFalse: '2.0 / 3.0',
        totalScore: 8.0,
        comment: 'Hoàn thành bài đúng thời gian, tốc độ xử lý câu hỏi tốt.',
      },
      {
        id: 'g-3',
        timestamp: '08/10/2026 09:00',
        examTitle: 'Đánh giá giữa học phần',
        multipleChoice: '4.0 / 4.0',
        fillInBlank: '2.8 / 3.0',
        trueFalse: '2.5 / 3.0',
        totalScore: 9.3,
        comment: 'Xuất sắc! Tư duy phân tích và vận dụng lý thuyết rất chuẩn xác.',
      },
    ],
  },
  '3122410199': {
    studentCode: '3122410199',
    candidateNumber: 'SBD-2026-0199',
    fullName: 'Nguyễn Minh Tâm',
    absenceCount: 1,
    totalSessions: 15,
    attendanceRate: '93.3%',
    averageScore: 8.2,
    rankLabel: 'Giỏi',
    absences: [
      {
        id: 'abs-201',
        sessionNumber: 6,
        date: '21/09/2026',
        timeSlot: 'Ca 2 (09:45 - 11:45)',
        topic: 'Buổi 6: Thực hành phân tích tình huống',
        status: 'ABSENT_EXCUSED',
        note: 'Tham gia đội tuyển học thuật cấp trường',
      },
    ],
    grades: [
      {
        id: 'g-201',
        timestamp: '10/09/2026 08:15',
        examTitle: 'Kiểm tra 15 phút - Đợt 1',
        multipleChoice: '3.5 / 4.0',
        fillInBlank: '2.5 / 3.0',
        trueFalse: '2.0 / 3.0',
        totalScore: 8.0,
        comment: 'Làm bài cẩn thận, trình bày rõ ràng.',
      },
      {
        id: 'g-202',
        timestamp: '08/10/2026 09:00',
        examTitle: 'Đánh giá giữa học phần',
        multipleChoice: '3.8 / 4.0',
        fillInBlank: '2.6 / 3.0',
        trueFalse: '2.0 / 3.0',
        totalScore: 8.4,
        comment: 'Có tiến bộ rõ rệt ở phần câu hỏi điền từ.',
      },
    ],
  },
}

function LandingPage() {
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>(CLASS_OPTIONS[0])
  const [studentCodeInput, setStudentCodeInput] = useState<string>('3122410142')
  const [lookupResult, setLookupResult] = useState<StudentLookupResult | null>({
    ...MOCK_STUDENT_DB['3122410142'],
    className: CLASS_OPTIONS[0],
  })
  const [lookupError, setLookupError] = useState<string>('')
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState<boolean>(false)
  const [hasSearched, setHasSearched] = useState<boolean>(true)

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleLookup = (event?: React.FormEvent) => {
    if (event) event.preventDefault()

    const trimmedCode = studentCodeInput.trim()
    setHasSearched(true)

    if (!trimmedCode) {
      setLookupResult(null)
      setLookupError('Vui lòng nhập mã số học sinh để tra cứu.')
      return
    }

    const matchedStudent = MOCK_STUDENT_DB[trimmedCode]
    if (!matchedStudent) {
      setLookupResult(null)
      setLookupError('Không tìm thấy thông tin học sinh')
      return
    }

    setLookupError('')
    setLookupResult({
      ...matchedStudent,
      className: selectedClass,
    })
  }

  const handleQuickFill = (code: string, className?: string) => {
    setStudentCodeInput(code)
    const targetClass = className || selectedClass
    if (className) setSelectedClass(className)

    const matchedStudent = MOCK_STUDENT_DB[code]
    setHasSearched(true)
    if (matchedStudent) {
      setLookupError('')
      setLookupResult({
        ...matchedStudent,
        className: targetClass,
      })
    } else {
      setLookupResult(null)
      setLookupError('Không tìm thấy thông tin học sinh')
    }
  }

  return (
    <div id="top" className="min-h-screen bg-[#F8FAF9] text-[#0F3822] selection:bg-[#D8F3DC] selection:text-[#0F3822]">
      {/* 1. HEADER (Top Navigation) */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Left: Brand Logo */}
          <button
            type="button"
            onClick={() => scrollToSection('top')}
            className="flex items-center gap-3 text-left transition hover:opacity-90"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] p-1.5 shadow-sm ring-1 ring-[#10B981]/20">
              <img
                src={logo}
                alt="FrogH Education"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="block text-lg font-extrabold tracking-tight text-[#0F3822]">
                FrogH Education
              </span>
              <span className="block text-xs font-medium text-[#10B981]">
                Smart Class Management
              </span>
            </div>
          </button>

          {/* Center: Smooth Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex lg:gap-2">
            <button
              type="button"
              onClick={() => scrollToSection('top')}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#0F3822] transition hover:bg-[#D8F3DC]/60"
            >
              Trang chủ
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features-section')}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#0F3822]/80 transition hover:bg-[#D8F3DC]/60 hover:text-[#0F3822]"
            >
              Tính năng
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('lookup-section')}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#0F3822]/80 transition hover:bg-[#D8F3DC]/60 hover:text-[#0F3822]"
            >
              Tra cứu
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about-footer')}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#0F3822]/80 transition hover:bg-[#D8F3DC]/60 hover:text-[#0F3822]"
            >
              Về chúng tôi
            </button>
          </nav>

          {/* Right: Auth Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-xl border border-[#0F3822]/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#0F3822] transition hover:border-[#0F3822] hover:bg-[#D8F3DC]/40"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="rounded-xl bg-[#0F3822] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#144b2e]"
            >
              Đăng ký
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            aria-label="Mở menu điều hướng"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/10 text-[#0F3822] transition hover:bg-[#D8F3DC]/50 md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-emerald-900/10 bg-white px-4 py-4 shadow-lg md:hidden">
            <div className="flex flex-col space-y-1.5">
              <button
                type="button"
                onClick={() => scrollToSection('top')}
                className="rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-[#0F3822] hover:bg-[#D8F3DC]/50"
              >
                Trang chủ
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features-section')}
                className="rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-[#0F3822] hover:bg-[#D8F3DC]/50"
              >
                Tính năng
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('lookup-section')}
                className="rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-[#0F3822] hover:bg-[#D8F3DC]/50"
              >
                Tra cứu
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('about-footer')}
                className="rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-[#0F3822] hover:bg-[#D8F3DC]/50"
              >
                Về chúng tôi
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-emerald-900/10 pt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl border border-[#0F3822]/25 py-2.5 text-center text-sm font-semibold text-[#0F3822] hover:bg-[#D8F3DC]/40"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="rounded-xl bg-[#0F3822] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#144b2e]"
              >
                Đăng ký
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden px-4 pt-8 pb-14 sm:px-6 lg:px-8 lg:pt-12 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F3822] via-[#134E2E] to-[#10B981] px-6 py-12 text-white shadow-xl sm:rounded-3xl sm:px-12 sm:py-16 lg:px-16 lg:py-20">
            {/* Subtle decorative circles */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#D8F3DC]/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#10B981]/20 blur-2xl" />

            <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D8F3DC]/30 bg-[#D8F3DC]/15 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#D8F3DC] sm:text-sm">
                  <Sparkles size={15} className="text-[#D8F3DC]" />
                  <span>Nền tảng Giáo dục Số Thế hệ mới</span>
                </div>

                <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Hệ thống Quản lý Đào tạo &amp; Giảng dạy FrogH
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#D8F3DC]/90 sm:text-lg">
                  Giải pháp số hóa toàn diện giúp giảng viên và học sinh quản lý lớp học thông minh,
                  điểm danh trực tuyến bằng mã ca học theo thời gian thực và tổ chức kiểm tra đa định dạng
                  minh bạch, chính xác.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => scrollToSection('lookup-section')}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-[#D8F3DC] px-6 py-3.5 text-sm font-bold text-[#0F3822] shadow-lg transition hover:-translate-y-0.5 hover:bg-white sm:text-base"
                  >
                    <Search size={18} />
                    <span>Tra cứu kết quả ngay</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:text-base"
                  >
                    <span>Vào cổng đào tạo</span>
                  </button>
                </div>

                {/* Quick highlights */}
                <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 sm:gap-6">
                  <div>
                    <p className="text-2xl font-extrabold text-[#D8F3DC] sm:text-3xl">100%</p>
                    <p className="mt-1 text-xs text-white/80 sm:text-sm">Điểm danh thời gian thực</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-[#D8F3DC] sm:text-3xl">4 Loại</p>
                    <p className="mt-1 text-xs text-white/80 sm:text-sm">Câu hỏi khảo thí chuẩn</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-[#D8F3DC] sm:text-3xl">24/7</p>
                    <p className="mt-1 text-xs text-white/80 sm:text-sm">Tra cứu điểm minh bạch</p>
                  </div>
                </div>
              </div>

              {/* Hero Right Preview Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md sm:p-6">
                  <div className="flex items-center justify-between border-b border-white/15 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8F3DC] text-[#0F3822]">
                        <GraduationCap size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Cổng thông tin Học vụ</p>
                        <p className="text-xs text-[#D8F3DC]/80">Cập nhật tức thì sau mỗi ca học</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#10B981] px-3 py-1 text-xs font-bold text-white">
                      Trực tuyến
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <QrCode size={18} className="text-[#D8F3DC]" />
                        <span className="text-sm font-medium text-white">Điểm danh buổi học</span>
                      </div>
                      <CheckCircle2 size={18} className="text-[#D8F3DC]" />
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileCheck2 size={18} className="text-[#D8F3DC]" />
                        <span className="text-sm font-medium text-white">Làm bài thi &amp; chấm tự động</span>
                      </div>
                      <CheckCircle2 size={18} className="text-[#D8F3DC]" />
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BarChart3 size={18} className="text-[#D8F3DC]" />
                        <span className="text-sm font-medium text-white">Theo dõi chuyên cần &amp; bảng điểm</span>
                      </div>
                      <CheckCircle2 size={18} className="text-[#D8F3DC]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KHUNG TRA CỨU NHANH KẾT QUẢ HỌC TẬP (PUBLIC LOOKUP) */}
      <section id="lookup-section" className="scroll-mt-20 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D8F3DC] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F3822]">
              <Search size={13} />
              Tra cứu công khai
            </span>
            <h2 className="mt-3 text-2xl font-extrabold text-[#0F3822] sm:text-3xl">
              Tra cứu nhanh kết quả học tập &amp; chuyên cần
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
              Chọn lớp học phần và nhập mã số học sinh để xem chi tiết tình trạng chuyên cần cùng bảng điểm quá trình.
            </p>
          </div>

          {/* Search Form Card */}
          <div className="mt-8 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-7">
            <form onSubmit={handleLookup} className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
              {/* Select Class */}
              <div className="md:col-span-5">
                <label
                  htmlFor="lookup-class-select"
                  className="mb-2 block text-sm font-semibold text-[#0F3822]"
                >
                  Chọn lớp
                </label>
                <div className="relative">
                  <select
                    id="lookup-class-select"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full rounded-xl border border-emerald-900/15 bg-[#F8FAF9] px-4 py-3 text-sm font-medium text-[#0F3822] outline-none transition focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-[#D8F3DC]"
                  >
                    {CLASS_OPTIONS.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Input Student ID */}
              <div className="md:col-span-5">
                <label
                  htmlFor="lookup-student-code"
                  className="mb-2 block text-sm font-semibold text-[#0F3822]"
                >
                  Mã số học sinh
                </label>
                <input
                  id="lookup-student-code"
                  type="text"
                  value={studentCodeInput}
                  onChange={(e) => setStudentCodeInput(e.target.value)}
                  placeholder="Ví dụ: 3122410142"
                  className="w-full rounded-xl border border-emerald-900/15 bg-[#F8FAF9] px-4 py-3 text-sm font-medium text-[#0F3822] outline-none transition focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-[#D8F3DC]"
                />
              </div>

              {/* Lookup Submit Button */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F3822] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#154d30]"
                >
                  <Search size={17} />
                  <span>Tra cứu</span>
                </button>
              </div>
            </form>

            {/* Quick suggestion helper bar */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3.5 text-xs text-gray-500">
              <span className="font-medium text-gray-600">Mã mẫu gợi ý:</span>
              <button
                type="button"
                onClick={() => handleQuickFill('3122410142')}
                className="inline-flex items-center gap-1 rounded-lg bg-[#D8F3DC]/70 px-2.5 py-1 font-semibold text-[#0F3822] transition hover:bg-[#D8F3DC]"
              >
                3122410142 (Lê Ngọc Anh Huy)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('3122410199')}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 font-medium text-gray-700 transition hover:bg-gray-200"
              >
                3122410199 (Nguyễn Minh Tâm)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('0000000000')}
                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 font-medium text-red-700 transition hover:bg-red-100"
              >
                Thử mã không tồn tại
              </button>
            </div>
          </div>

          {/* Lookup Error Alert */}
          {hasSearched && lookupError && (
            <div
              role="alert"
              className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle size={22} />
              </div>
              <div>
                <p className="font-bold text-red-800">{lookupError}</p>
                <p className="mt-0.5 text-sm text-red-600">
                  Không có hồ sơ trùng khớp với mã số <strong>{studentCodeInput || '(trống)'}</strong> trong lớp{' '}
                  <strong>{selectedClass}</strong>. Vui lòng kiểm tra lại hoặc thử mã mẫu{' '}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('3122410142')}
                    className="font-semibold underline hover:text-red-900"
                  >
                    3122410142
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Lookup Result Display */}
          {hasSearched && lookupResult && (
            <div className="mt-6 space-y-6">
              {/* Student Profile Summary Card */}
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0F3822] text-xl font-bold text-[#D8F3DC] shadow-sm">
                      {lookupResult.fullName
                        .split(' ')
                        .slice(-2)
                        .map((word) => word[0])
                        .join('')}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-xl font-extrabold text-[#0F3822] sm:text-2xl">
                          {lookupResult.fullName}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D8F3DC] px-3 py-0.5 text-xs font-bold text-[#0F3822]">
                          <Check size={13} />
                          Đang theo học
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Mã số học sinh: <strong className="text-[#0F3822]">{lookupResult.studentCode}</strong> • SBD:{' '}
                        <strong className="text-[#0F3822]">{lookupResult.candidateNumber}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="rounded-xl bg-[#F8FAF9] px-4 py-2.5 text-right ring-1 ring-emerald-900/10">
                      <span className="block text-xs font-medium text-gray-500">Điểm TB quá trình</span>
                      <span className="text-lg font-extrabold text-[#10B981]">
                        {lookupResult.averageScore.toFixed(1)} / 10
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Key Info Boxes */}
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-emerald-900/10 bg-[#F8FAF9] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Họ và tên</p>
                    <p className="mt-1.5 text-base font-bold text-[#0F3822]">{lookupResult.fullName}</p>
                    <p className="mt-0.5 text-xs text-gray-500">Học viên chính thức</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-900/10 bg-[#F8FAF9] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Số báo danh / Mã HS</p>
                    <p className="mt-1.5 text-base font-bold text-[#0F3822]">{lookupResult.studentCode}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{lookupResult.candidateNumber}</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-900/10 bg-[#F8FAF9] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Lớp học phần</p>
                    <p className="mt-1.5 text-base font-bold text-[#0F3822]">{lookupResult.className}</p>
                    <p className="mt-0.5 text-xs text-[#10B981] font-medium">Học kỳ I • 2026 - 2027</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-900/10 bg-[#F8FAF9] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Số ngày vắng</p>
                      <button
                        type="button"
                        onClick={() => setIsAbsenceModalOpen(true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#D8F3DC] px-2.5 py-1 text-xs font-bold text-[#0F3822] transition hover:bg-[#10B981] hover:text-white"
                      >
                        <Eye size={13} />
                        <span>Chi tiết</span>
                      </button>
                    </div>
                    <p className="mt-1.5 text-base font-bold text-[#0F3822]">
                      {lookupResult.absenceCount} buổi{' '}
                      <span className="text-xs font-normal text-gray-500">
                        / {lookupResult.totalSessions} buổi
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Tỷ lệ chuyên cần: <strong className="text-[#0F3822]">{lookupResult.attendanceRate}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Process Grades Table Card */}
              <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-2 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="text-lg font-bold text-[#0F3822]">
                      Bảng điểm quá trình
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                      Tổng hợp điểm thành phần theo từng cấu trúc câu hỏi của các bài kiểm tra tại lớp{' '}
                      <strong className="text-[#0F3822]">{lookupResult.className}</strong>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-[#F8FAF9] px-3 py-1.5 text-xs font-semibold text-[#0F3822] ring-1 ring-emerald-900/10 sm:self-center">
                    <Award size={15} className="text-[#10B981]" />
                    Xếp loại: {lookupResult.rankLabel}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-emerald-900/10 bg-[#F8FAF9] text-xs font-bold uppercase tracking-wider text-[#0F3822]/80">
                        <th className="px-6 py-4">Thời gian</th>
                        <th className="px-4 py-4 text-center">Trắc nghiệm</th>
                        <th className="px-4 py-4 text-center">Điền từ</th>
                        <th className="px-4 py-4 text-center">Đúng sai</th>
                        <th className="px-4 py-4 text-center">Tổng điểm</th>
                        <th className="px-6 py-4">Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lookupResult.grades.map((row) => (
                        <tr
                          key={row.id}
                          className="transition hover:bg-[#D8F3DC]/25"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-[#0F3822]">{row.examTitle}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                              <Clock size={12} />
                              {row.timestamp}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-gray-700">
                            <span className="rounded-lg bg-[#F8FAF9] px-2.5 py-1 ring-1 ring-gray-200">
                              {row.multipleChoice}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-gray-700">
                            <span className="rounded-lg bg-[#F8FAF9] px-2.5 py-1 ring-1 ring-gray-200">
                              {row.fillInBlank}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-gray-700">
                            <span className="rounded-lg bg-[#F8FAF9] px-2.5 py-1 ring-1 ring-gray-200">
                              {row.trueFalse}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center rounded-xl bg-[#D8F3DC] px-3 py-1 text-sm font-extrabold text-[#0F3822]">
                              {row.totalScore.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {row.comment}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. TÍNH NĂNG NỔI BẬT (HIGHLIGHT FEATURES) */}
      <section id="features-section" className="scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D8F3DC] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F3822]">
              <Layers size={13} />
              Thế mạnh cốt lõi
            </span>
            <h2 className="mt-3 text-2xl font-extrabold text-[#0F3822] sm:text-3xl">
              Tính năng nổi bật của hệ thống FrogH
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
              Được thiết kế tối ưu cho môi trường đại học và phổ thông với quy trình khép kín từ điểm danh,
              kiểm tra đánh giá đến thống kê kết quả học tập.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="group flex flex-col justify-between rounded-2xl border border-emerald-900/10 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#10B981]/50 hover:shadow-md">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#0F3822] transition group-hover:bg-[#0F3822] group-hover:text-[#D8F3DC]">
                  <UserCheck size={26} />
                </div>
                <span className="mt-5 inline-block rounded-full bg-[#F8FAF9] px-3 py-1 text-xs font-semibold text-[#10B981] ring-1 ring-[#10B981]/20">
                  Real-time Attendance
                </span>
                <h3 className="mt-3 text-xl font-bold text-[#0F3822]">
                  Điểm danh thời gian thực
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-600">
                  Khởi tạo phiên điểm danh nhanh chóng theo từng ca học với mã bảo mật riêng biệt,
                  thiết lập mốc giờ có mặt, đi trễ và đóng phiên tự động giúp chống gian lận tuyệt đối.
                </p>
              </div>

              <ul className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-xs font-medium text-[#0F3822]/80">
                <li className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#10B981]" />
                  <span>Mã ca học động &amp; giới hạn khung giờ</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#10B981]" />
                  <span>Tự động phân loại Có mặt / Đi trễ / Vắng</span>
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="group flex flex-col justify-between rounded-2xl border border-emerald-900/10 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#10B981]/50 hover:shadow-md">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#0F3822] transition group-hover:bg-[#0F3822] group-hover:text-[#D8F3DC]">
                  <BookOpen size={26} />
                </div>
                <span className="mt-5 inline-block rounded-full bg-[#F8FAF9] px-3 py-1 text-xs font-semibold text-[#10B981] ring-1 ring-[#10B981]/20">
                  Smart Exam Builder
                </span>
                <h3 className="mt-3 text-xl font-bold text-[#0F3822]">
                  Đề thi &amp; Kiểm tra Wizard
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-600">
                  Trình tạo đề thi trực tuyến mạnh mẽ hỗ trợ đa dạng 4 loại câu hỏi chuẩn khảo thí,
                  tích hợp gõ công thức Toán học LaTeX, đồng hồ đếm ngược tự động và quy tắc chấm điểm linh hoạt.
                </p>
              </div>

              <ul className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-xs font-medium text-[#0F3822]/80">
                <li className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#10B981]" />
                  <span>4 định dạng: Trắc nghiệm, Đúng/Sai, Điền từ, Tự luận</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#10B981]" />
                  <span>Đếm ngược thời gian thực &amp; tự động thu bài</span>
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="group flex flex-col justify-between rounded-2xl border border-emerald-900/10 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#10B981]/50 hover:shadow-md">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#0F3822] transition group-hover:bg-[#0F3822] group-hover:text-[#D8F3DC]">
                  <BarChart3 size={26} />
                </div>
                <span className="mt-5 inline-block rounded-full bg-[#F8FAF9] px-3 py-1 text-xs font-semibold text-[#10B981] ring-1 ring-[#10B981]/20">
                  Transparent Analytics
                </span>
                <h3 className="mt-3 text-xl font-bold text-[#0F3822]">
                  Bảng điểm &amp; Thống kê minh bạch
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-600">
                  Theo dõi tiến độ học tập xuyên suốt học kỳ với bảng điểm chi tiết từng phần,
                  thống kê chuyên cần trực quan và hỗ trợ xuất báo cáo Excel phục vụ công tác quản lý đào tạo.
                </p>
              </div>

              <ul className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-xs font-medium text-[#0F3822]/80">
                <li className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#10B981]" />
                  <span>Công khai điểm thành phần &amp; nhận xét giảng viên</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#10B981]" />
                  <span>Tổng hợp lịch sử chuyên cần &amp; xuất file nhanh</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer id="about-footer" className="border-t border-emerald-900/10 bg-[#0F3822] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Brand Column */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] p-1.5">
                  <img
                    src={logo}
                    alt="FrogH Education"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">FrogH Education System</h3>
                  <p className="text-xs text-[#D8F3DC]/80">Hệ thống Quản lý Lớp học &amp; Khảo thí Trực tuyến</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#D8F3DC]/80">
                Nền tảng hỗ trợ giảng viên và học sinh tối ưu hóa quy trình quản lý lớp học,
                điểm danh tự động và đánh giá năng lực học tập minh bạch, hiện đại.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#D8F3DC]">
                Liên kết nhanh
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-white/80">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('top')}
                    className="transition hover:text-[#D8F3DC]"
                  >
                    Trang chủ
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('lookup-section')}
                    className="transition hover:text-[#D8F3DC]"
                  >
                    Tra cứu kết quả học tập
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('features-section')}
                    className="transition hover:text-[#D8F3DC]"
                  >
                    Tính năng nổi bật
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="transition hover:text-[#D8F3DC]"
                  >
                    Đăng nhập hệ thống
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="transition hover:text-[#D8F3DC]"
                  >
                    Đăng ký tài khoản
                  </button>
                </li>
              </ul>
            </div>

            {/* Project Note */}
            <div className="md:col-span-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#D8F3DC]">
                Ghi chú đồ án
              </h4>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-[#D8F3DC]/90">
                <p className="font-semibold text-white">
                  Đồ án học phần J2EE - Xây dựng Hệ thống Quản lý Lớp học (Class Management)
                </p>
                <p className="mt-2">
                  Ứng dụng kiến trúc Spring Boot RESTful API kết hợp giao diện React + Tailwind CSS
                  theo chuẩn Design System FrogH Education.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#D8F3DC]/70 sm:flex-row">
            <p>© {new Date().getFullYear()} FrogH Education System. All rights reserved.</p>
            <p>Thiết kế &amp; Phát triển bởi Đội ngũ FrogH</p>
          </div>
        </div>
      </footer>

      {/* ABSENCE DETAIL MODAL */}
      {isAbsenceModalOpen && lookupResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setIsAbsenceModalOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-[#0F3822] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8F3DC] text-[#0F3822]">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Chi tiết lịch sử chuyên cần &amp; ngày vắng
                  </h3>
                  <p className="text-xs text-[#D8F3DC]/85">
                    {lookupResult.fullName} ({lookupResult.studentCode}) • {lookupResult.className}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng hộp thoại"
                onClick={() => setIsAbsenceModalOpen(false)}
                className="rounded-xl p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F8FAF9] px-4 py-3 text-xs ring-1 ring-emerald-900/10">
                <span className="font-semibold text-[#0F3822]">
                  Tổng số buổi vắng: <strong className="text-red-600">{lookupResult.absenceCount} buổi</strong> /{' '}
                  {lookupResult.totalSessions} buổi học
                </span>
                <span className="font-semibold text-[#10B981]">
                  Tỷ lệ tham gia: {lookupResult.attendanceRate}
                </span>
              </div>

              <div className="space-y-3">
                {lookupResult.absences.map((item) => {
                  const isExcused = item.status === 'ABSENT_EXCUSED'
                  const isLate = item.status === 'LATE'

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 bg-[#F8FAF9] p-4 transition hover:border-emerald-900/20"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#0F3822]">
                          <span>Ngày {item.date}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs font-semibold text-gray-600">{item.timeSlot}</span>
                        </div>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                            isLate
                              ? 'bg-amber-100 text-amber-800'
                              : isExcused
                                ? 'bg-[#D8F3DC] text-[#0F3822]'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isLate ? 'Đi trễ' : isExcused ? 'Vắng có phép' : 'Vắng không phép'}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-gray-800">
                        {item.topic}
                      </p>
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-500">
                        <Info size={14} className="mt-0.5 shrink-0 text-[#10B981]" />
                        <span>Ghi chú: {item.note}</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setIsAbsenceModalOpen(false)}
                className="rounded-xl bg-[#0F3822] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#154d30]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage

