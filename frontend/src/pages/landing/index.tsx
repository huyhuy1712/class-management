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
  School,
  ChevronRight,
  Loader2,
  FileText,
  User,
  Mail,
  Phone,
} from 'lucide-react'
// @ts-ignore
import logo from '../../assets/logos/logo.png'
import publicService from '../../services/publicService'

// ==========================================
// TYPE DEFINITIONS (Ánh xạ từ DTO Backend)
// ==========================================
interface StudentProfile {
  id: number | string
  studentCode: string
  fullName: string
  email?: string
  phone?: string
  avatar?: string
}

interface AbsenceDetail {
  date: string
  status: 'ABSENT' | 'LATE' | string
  note?: string
}

interface ExamScoreItem {
  examTitle: string
  examType?: string
  date?: string
  score?: number | null
  maxScore?: number | null
  status?: string
  teacherComment?: string
}

interface ClassItem {
  id: number | string
  name: string
  code: string
  academicYear?: string
  subjectName?: string
  teacherName?: string
  description?: string
  status?: string
  absentCount?: number
  totalSessions?: number
  absenceDetails?: AbsenceDetail[]
  examScores?: ExamScoreItem[]
}

interface AttendanceRecord {
  id: number | string
  studentId?: number | string
  studentCode?: string
  date?: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | string
  note?: string
}

interface ExamRecord {
  id: number | string
  title?: string
  examTitle?: string
  examType?: string
  name?: string
  classroomId?: number | string
  createdAt?: string
  date?: string
  score?: number | string | null
  maxScore?: number | string | null
  comment?: string
  teacherComment?: string
  status?: string
}

function LandingPage() {
  const navigate = useNavigate()

  // Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Search State
  const [studentCodeInput, setStudentCodeInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Student & Classes Data (100% REST API)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [studentClasses, setStudentClasses] = useState<ClassItem[]>([])

  // Selected Class & Performance Detail (100% REST API)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [classDetailLoading, setClassDetailLoading] = useState<boolean>(false)
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [exams, setExams] = useState<ExamRecord[]>([])

  // Modal State
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState<boolean>(false)
  const [modalClass, setModalClass] = useState<ClassItem | null>(null)

  const openAbsenceModal = (cls: ClassItem) => {
    setModalClass(cls)
    setIsAbsenceModalOpen(true)
  }

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ==========================================
  // XỬ LÝ TRA CỨU HỌC SINH QUA REST API
  // ==========================================
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const trimmedCode = studentCodeInput.trim()

    // 1. Validate ô nhập
    if (!trimmedCode) {
      setHasSearched(true)
      setErrorMessage('Vui lòng nhập mã số học sinh')
      setStudentProfile(null)
      setStudentClasses([])
      setSelectedClass(null)
      setAttendances([])
      setExams([])
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    setErrorMessage('')
    setStudentProfile(null)
    setStudentClasses([])
    setSelectedClass(null)
    setAttendances([])
    setExams([])

    try {
      // 2. Gọi API Public tra cứu học sinh theo mã (không cần đăng nhập)
      const data = await publicService.lookupStudentByCode(trimmedCode)

      if (!data || !data.id) {
        setErrorMessage('Không tìm thấy thông tin học sinh với mã này. Vui lòng kiểm tra lại!')
        setIsLoading(false)
        return
      }

      const profile: StudentProfile = {
        id: data.id,
        studentCode: data.studentCode,
        fullName: data.fullName || 'Học sinh',
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
      }
      setStudentProfile(profile)

      // 3. Lấy danh sách các lớp học phần học sinh đã tham gia từ response (bao gồm dữ liệu điểm danh và điểm số)
      const matchedClasses: ClassItem[] = (data.classrooms || []).map((cls: any) => ({
        id: cls.classId,
        name: cls.className,
        code: cls.classCode,
        academicYear: cls.academicYear || 'Năm học 2026 - 2027',
        subjectName: cls.subjectName,
        teacherName: cls.teacherName,
        description: cls.description,
        status: cls.status,
        absentCount: cls.absentCount ?? 0,
        totalSessions: cls.totalSessions ?? 0,
        absenceDetails: cls.absenceDetails || [],
        examScores: cls.examScores || [],
      }))

      setStudentClasses(matchedClasses)

      // Tự động kích hoạt lớp đầu tiên nếu có
      if (matchedClasses.length > 0) {
        fetchClassPerformance(matchedClasses[0], profile)
      }
    } catch (err: any) {
      console.error('Lỗi khi tra cứu học sinh:', err)
      if (err.response?.status === 404) {
        setErrorMessage(
          err.response?.data?.message || 'Không tìm thấy thông tin học sinh với mã này. Vui lòng kiểm tra lại!'
        )
      } else if (err.response?.status >= 500) {
        setErrorMessage('Lỗi hệ thống hoặc mất kết nối máy chủ')
      } else {
        setErrorMessage(
          err.response?.data?.message || 'Lỗi hệ thống hoặc mất kết nối máy chủ. Vui lòng thử lại sau!'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // XỬ LÝ LẤY ĐIỂM & ĐIỂM DANH KHI CHỌN LỚP
  // ==========================================
  const fetchClassPerformance = async (classItem: ClassItem, student: StudentProfile) => {
    setSelectedClass(classItem)
    setClassDetailLoading(true)
    setAttendances([])
    setExams([])

    try {
      // Dữ liệu điểm danh và kết quả bài thi đã có sẵn trong classItem từ API tra cứu công khai
      const classExams: ExamRecord[] = (classItem.examScores || []).map((ex: ExamScoreItem, idx: number) => ({
        id: `exam-${classItem.id}-${idx}`,
        title: ex.examTitle,
        examTitle: ex.examTitle,
        examType: ex.examType,
        date: ex.date,
        score: ex.score,
        maxScore: ex.maxScore,
        status: ex.status,
        teacherComment: ex.teacherComment,
        comment: ex.teacherComment,
      }))

      setExams(classExams)
    } catch (err) {
      console.error('Lỗi khi tải chi tiết lớp học:', err)
    } finally {
      setClassDetailLoading(false)
    }
  }

  // Tính toán số liệu chuyên cần từ selectedClass (đã có sẵn từ API tra cứu công khai)
  const currentAbsenceDetails = selectedClass?.absenceDetails || []
  const currentAbsentCount = selectedClass?.absentCount ?? currentAbsenceDetails.length
  const currentTotalSessions = selectedClass?.totalSessions || (currentAbsentCount > 0 ? currentAbsentCount : 0)
  const attendanceRate =
    currentTotalSessions > 0
      ? `${(((currentTotalSessions - currentAbsentCount) / currentTotalSessions) * 100).toFixed(1)}%`
      : '100%'

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
              <img src={logo} alt="FrogH Education" className="h-full w-full object-contain" />
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
                        <span className="text-sm font-medium text-white">Điểm danh bằng mã ca học</span>
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
              Tra cứu kết quả học tập &amp; chuyên cần
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
              Nhập mã số học sinh để xem thông tin học viên, danh sách các lớp học phần và điểm số chi tiết từ hệ thống.
            </p>
          </div>

          {/* Search Form Card (Chuỗi rỗng ban đầu, không mock code, không thanh mã gợi ý) */}
          <div className="mt-8 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-7">
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="lookup-student-code"
                  className="mb-2 block text-sm font-semibold text-[#0F3822]"
                >
                  Mã số học sinh
                </label>
                <div className="relative">
                  <input
                    id="lookup-student-code"
                    type="text"
                    value={studentCodeInput}
                    onChange={(e) => {
                      setStudentCodeInput(e.target.value)
                      if (errorMessage) setErrorMessage('')
                    }}
                    placeholder="Nhập mã số học sinh..."
                    disabled={isLoading}
                    className="w-full rounded-xl border border-emerald-900/15 bg-[#F8FAF9] px-4 py-3.5 text-sm font-medium text-[#0F3822] outline-none transition focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-[#D8F3DC] disabled:opacity-60"
                  />
                  {studentCodeInput && (
                    <button
                      type="button"
                      aria-label="Xóa nội dung nhập"
                      onClick={() => {
                        setStudentCodeInput('')
                        if (errorMessage) setErrorMessage('')
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Nút Tra cứu */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#0F3822] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#154d30] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[150px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    <span>Tra cứu</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Loading State Spinner */}
          {isLoading && (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-emerald-900/10 bg-white p-12 text-center shadow-sm">
              <Loader2 size={36} className="animate-spin text-[#10B981]" />
              <p className="mt-3 text-base font-semibold text-[#0F3822]">
                Đang tra cứu dữ liệu từ hệ thống máy chủ...
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Đang đồng bộ hồ sơ học viên, danh sách lớp học và chuyên cần
              </p>
            </div>
          )}

          {/* Error / Reminder State */}
          {!isLoading && hasSearched && errorMessage && (
            <div
              role="alert"
              className={`mt-6 flex items-start gap-3.5 rounded-2xl border p-5 shadow-sm transition-all ${
                errorMessage === 'Vui lòng nhập mã số học sinh'
                  ? 'border-amber-200 bg-amber-50/90 text-amber-900'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  errorMessage === 'Vui lòng nhập mã số học sinh'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                <AlertCircle size={22} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">{errorMessage}</p>
                {errorMessage === 'Vui lòng nhập mã số học sinh' ? (
                  <p className="mt-1 text-sm text-amber-800">
                    Bạn cần nhập mã số học sinh vào ô tìm kiếm để tra cứu thông tin học tập và chuyên cần.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-red-600">
                    Vui lòng đối chiếu lại mã học viên đã được cấp.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* KẾT QUẢ KHI TÌM THẤY HỌC SINH TỪ REST API */}
          {!isLoading && hasSearched && studentProfile && (
            <div className="mt-8 space-y-6">
              {/* KHỐI 1: THÔNG TIN HỌC SINH */}
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0F3822] text-xl font-bold text-[#D8F3DC] shadow-sm">
                      {studentProfile.avatar ? (
                        <img
                          src={studentProfile.avatar}
                          alt={studentProfile.fullName}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        studentProfile.fullName
                          .split(' ')
                          .slice(-2)
                          .map((word) => word[0])
                          .join('')
                          .toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-xl font-extrabold text-[#0F3822] sm:text-2xl">
                          {studentProfile.fullName}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D8F3DC] px-3 py-0.5 text-xs font-bold text-[#0F3822]">
                          <Check size={13} />
                          Học viên chính thức
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <User size={14} className="text-[#10B981]" />
                          Mã số: <strong className="text-[#0F3822]">{studentProfile.studentCode}</strong>
                        </span>
                        {studentProfile.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail size={14} className="text-[#10B981]" />
                            {studentProfile.email}
                          </span>
                        )}
                        {studentProfile.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone size={14} className="text-[#10B981]" />
                            {studentProfile.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-xl bg-[#F8FAF9] px-4 py-2.5 ring-1 ring-emerald-900/10 sm:self-center">
                    <GraduationCap size={20} className="text-[#10B981]" />
                    <span className="text-xs font-bold text-[#0F3822]">
                      {studentClasses.length} lớp học phần tham gia
                    </span>
                  </div>
                </div>

                {/* KHỐI 2: GRID DANH SÁCH LỚP HỌC PHẦN */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-[#0F3822] sm:text-lg">
                        Danh sách lớp học phần
                      </h4>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Nhấn vào một lớp học bên dưới để tải bảng điểm và tình trạng chuyên cần trực tiếp từ hệ thống
                      </p>
                    </div>
                    {studentClasses.length > 0 && (
                      <span className="rounded-lg bg-[#D8F3DC]/70 px-2.5 py-1 text-xs font-semibold text-[#0F3822]">
                        {selectedClass ? 'Đang chọn 1 lớp' : 'Chọn lớp để xem'}
                      </span>
                    )}
                  </div>

                  {studentClasses.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-emerald-900/20 bg-[#F8FAF9] p-6 text-center text-sm text-gray-500">
                      Học sinh này hiện chưa tham gia lớp học phần nào trên hệ thống.
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {studentClasses.map((cls) => {
                        const isSelected = selectedClass && String(cls.id) === String(selectedClass.id)

                        return (
                          <div
                            key={cls.id}
                            onClick={() => fetchClassPerformance(cls, studentProfile)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                fetchClassPerformance(cls, studentProfile)
                              }
                            }}
                            className={`group relative flex cursor-pointer flex-col justify-between rounded-xl p-5 transition-all duration-200 outline-none ${
                              isSelected
                                ? 'border-2 border-[#10B981] bg-[#D8F3DC]/25 shadow-md ring-4 ring-[#D8F3DC]/50'
                                : 'border border-emerald-900/10 bg-[#F8FAF9] hover:-translate-y-0.5 hover:border-[#10B981]/50 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                    isSelected
                                      ? 'bg-[#0F3822] text-[#D8F3DC]'
                                      : 'bg-[#D8F3DC] text-[#0F3822] group-hover:bg-[#0F3822] group-hover:text-[#D8F3DC]'
                                  }`}
                                >
                                  <School size={20} />
                                </div>

                                {isSelected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                                    <Check size={12} />
                                    Đang xem
                                  </span>
                                ) : (
                                  <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-gray-200">
                                    {cls.code}
                                  </span>
                                )}
                              </div>

                              <h5 className="mt-3.5 text-base font-bold text-[#0F3822] transition group-hover:text-[#10B981]">
                                {cls.name}
                              </h5>

                              <p className="mt-1 text-xs text-gray-500">
                                {cls.academicYear || 'Năm học 2026 - 2027'}
                              </p>

                              {cls.teacherName && (
                                <p className="mt-0.5 text-xs text-gray-600">
                                  Giảng viên: <strong className="text-[#0F3822]">{cls.teacherName}</strong>
                                </p>
                              )}

                              {cls.subjectName && (
                                <p className="mt-0.5 text-xs font-medium text-[#10B981]">
                                  Môn: {cls.subjectName}
                                </p>
                              )}

                              {/* Hiển thị số ngày vắng & Nút xem chi tiết trực tiếp trên Card */}
                              <div className="mt-3.5 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 ring-1 ring-emerald-900/5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F3822]">
                                  <Calendar size={13} className="text-[#10B981]" />
                                  <span>Vắng:</span>
                                  <span
                                    className={
                                      (cls.absentCount ?? 0) > 0 ? 'font-bold text-red-600' : 'font-bold text-[#10B981]'
                                    }
                                  >
                                    {cls.absentCount ?? 0} buổi
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openAbsenceModal(cls)
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#D8F3DC] px-2 py-0.5 text-[11px] font-bold text-[#0F3822] transition hover:bg-[#10B981] hover:text-white"
                                >
                                  <Eye size={12} />
                                  <span>Chi tiết</span>
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold">
                              <span
                                className={
                                  isSelected ? 'text-[#0F3822]' : 'text-gray-400 group-hover:text-[#0F3822]'
                                }
                              >
                                {isSelected ? 'Đang hiển thị dữ liệu' : 'Bấm xem điểm & vắng'}
                              </span>
                              <ChevronRight
                                size={16}
                                className={`transition ${
                                  isSelected
                                    ? 'rotate-90 text-[#10B981]'
                                    : 'text-gray-400 group-hover:translate-x-0.5 group-hover:text-[#0F3822]'
                                }`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* KHỐI 3: KHI CLICK CHỌN 1 CARD LỚP -> HIỂN THỊ CHI TIẾT TỪ API */}
              {classDetailLoading && (
                <div className="flex items-center justify-center rounded-2xl border border-emerald-900/10 bg-white p-8">
                  <Loader2 size={24} className="animate-spin text-[#10B981]" />
                  <span className="ml-2 text-sm font-semibold text-[#0F3822]">
                    Đang tải điểm số và chuyên cần từ hệ thống...
                  </span>
                </div>
              )}

              {!classDetailLoading && selectedClass && (
                <div className="space-y-6 transition-all duration-300">
                  {/* 4 Thẻ tóm tắt thông tin của lớp được chọn */}
                  <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm sm:p-7">
                    <div className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
                          Chi tiết lớp đang chọn
                        </span>
                        <h4 className="mt-0.5 text-xl font-bold text-[#0F3822]">
                          {selectedClass.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#F8FAF9] px-4 py-2 text-right ring-1 ring-emerald-900/10">
                          <span className="block text-xs font-medium text-gray-500">Mã lớp học phần</span>
                          <span className="text-base font-extrabold text-[#0F3822]">
                            {selectedClass.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-emerald-900/10 bg-[#F8FAF9] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Họ và tên
                        </p>
                        <p className="mt-1.5 text-base font-bold text-[#0F3822]">
                          {studentProfile.fullName}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">Học viên chính thức</p>
                      </div>

                      <div className="rounded-xl border border-emerald-900/10 bg-[#F8FAF9] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Mã số sinh viên
                        </p>
                        <p className="mt-1.5 text-base font-bold text-[#0F3822]">
                          {studentProfile.studentCode}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">Hệ thống FrogH ID</p>
                      </div>

                      <div className="rounded-xl border border-emerald-900/10 bg-[#F8FAF9] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Lớp học phần
                        </p>
                        <p className="mt-1.5 truncate text-base font-bold text-[#0F3822]">
                          {selectedClass.name}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-[#10B981]">
                          {selectedClass.academicYear || 'Năm học 2026 - 2027'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-900/10 bg-[#F8FAF9] p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Số ngày vắng
                          </p>
                          <button
                            type="button"
                            onClick={() => openAbsenceModal(selectedClass)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#D8F3DC] px-2.5 py-1 text-xs font-bold text-[#0F3822] transition hover:bg-[#10B981] hover:text-white"
                          >
                            <Eye size={13} />
                            <span>Chi tiết</span>
                          </button>
                        </div>
                        <p className="mt-1.5 text-base font-bold text-[#0F3822]">
                          {selectedClass.absentCount ?? 0} buổi{' '}
                          <span className="text-xs font-normal text-gray-500">
                            {(selectedClass.totalSessions ?? 0) > 0
                              ? `/ ${selectedClass.totalSessions} buổi ghi nhận`
                              : ''}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Tỷ lệ chuyên cần: <strong className="text-[#0F3822]">{attendanceRate}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BẢNG ĐIỂM BÀI THI TỪ API (FIXED RESPONSIVE MOBILE) */}
                  <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
                      <div>
                        <h4 className="text-lg font-bold text-[#0F3822]">
                          Bảng điểm bài thi &amp; đánh giá — {selectedClass.name}
                        </h4>
                        <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                          Dữ liệu bài kiểm tra được đồng bộ trực tiếp từ hệ thống khảo thí trực tuyến
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-[#F8FAF9] px-3 py-1.5 text-xs font-semibold text-[#0F3822] ring-1 ring-emerald-900/10 sm:self-center">
                        <FileText size={15} className="text-[#10B981]" />
                        {exams.length} bài kiểm tra
                      </span>
                    </div>

                    {/* Gợi ý vuốt ngang trên mobile */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400 sm:hidden">
                      <span>Kéo ngang để xem đầy đủ cột điểm →</span>
                    </div>

                    {/* Wrapper cuộn ngang responsive với style -webkit-overflow-scrolling */}
                    <div
                      className="mt-2 w-full overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {exams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-900/15 bg-[#F8FAF9] py-10 text-center">
                          <FileCheck2 size={36} className="text-[#10B981]/60" />
                          <p className="mt-2.5 text-sm font-semibold text-[#0F3822]">
                            Chưa có dữ liệu bài kiểm tra cho lớp này
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Giảng viên chưa công bố bài thi hoặc bạn chưa tham gia làm bài trong lớp học phần này.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-emerald-900/10 bg-[#F8FAF9] text-xs font-bold uppercase tracking-wider text-[#0F3822]/80">
                              <th className="px-5 py-4 min-w-[150px]">Thời gian</th>
                              <th className="px-5 py-4 min-w-[200px]">Tên bài kiểm tra / Dạng bài</th>
                              <th className="px-4 py-4 text-center min-w-[130px]">Điểm đạt / Thang điểm</th>
                              <th className="px-5 py-4 min-w-[160px]">Nhận xét</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {exams.map((examItem, index) => (
                              <tr key={examItem.id || index} className="transition hover:bg-[#D8F3DC]/20">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <Clock size={13} className="text-[#10B981]" />
                                    <span>
                                      {examItem.date ||
                                        examItem.createdAt ||
                                        'Đã hoàn thành'}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <p className="font-semibold text-[#0F3822]">
                                    {examItem.examTitle || examItem.title || examItem.name || `Bài kiểm tra ${index + 1}`}
                                  </p>
                                  {(examItem.examType || examItem.status) && (
                                    <span className="mt-0.5 inline-block text-[11px] font-medium text-gray-500">
                                      {examItem.examType ? `Môn/Dạng bài: ${examItem.examType}` : ''}
                                      {examItem.examType && examItem.status ? ' • ' : ''}
                                      {examItem.status ? `Trạng thái: ${examItem.status}` : ''}
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-4 text-center">
                                  <div className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-[#D8F3DC] px-3.5 py-1.5 text-sm font-extrabold text-[#0F3822] shadow-2xs">
                                    <span>
                                      {examItem.score !== undefined && examItem.score !== null
                                        ? examItem.score
                                        : '—'}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500">
                                      /{' '}
                                      {examItem.maxScore !== undefined && examItem.maxScore !== null
                                        ? examItem.maxScore
                                        : '10'}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-xs sm:text-sm text-gray-600">
                                  {examItem.teacherComment ||
                                    examItem.comment ||
                                    'Hoàn thành bài kiểm tra theo đúng quy định'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                  <img src={logo} alt="FrogH Education" className="h-full w-full object-contain" />
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

      {/* ABSENCE DETAIL MODAL (Dữ liệu trực tiếp từ API Public Lookup) */}
      {isAbsenceModalOpen && modalClass && studentProfile && (
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
                    {studentProfile.fullName} ({studentProfile.studentCode}) • {modalClass.name}
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
                  Số buổi vắng ghi nhận:{' '}
                  <strong className="text-red-600">{modalClass.absentCount ?? 0} buổi</strong>
                  {(modalClass.totalSessions ?? 0) > 0 && ` / ${modalClass.totalSessions} buổi học`}
                </span>
                <span className="font-semibold text-[#10B981]">
                  Lớp: {modalClass.name} ({modalClass.code})
                </span>
              </div>

              {(!modalClass.absenceDetails || modalClass.absenceDetails.length === 0) ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-900/20 bg-[#F8FAF9] py-8 text-center">
                  <CheckCircle2 size={32} className="text-[#10B981]" />
                  <p className="mt-2 text-sm font-bold text-[#0F3822]">
                    Không có buổi vắng nào!
                  </p>
                  <p className="text-xs text-gray-500">
                    Học sinh tham gia đầy đủ tất cả các buổi học phần đã được điểm danh.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modalClass.absenceDetails.map((item, idx) => {
                    const isExcused = item.status === 'ABSENT_EXCUSED'
                    const isLate = item.status === 'LATE'

                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gray-100 bg-[#F8FAF9] p-4 transition hover:border-emerald-900/20"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-[#0F3822]">
                            <span>Buổi {idx + 1}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs font-semibold text-gray-600">
                              {item.date || 'Chưa cập nhật ngày'}
                            </span>
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

                        {item.note && (
                          <p className="mt-2 text-xs font-medium text-gray-700">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
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

