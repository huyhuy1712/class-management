import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Sparkles,
  X,
  Send,
  Lock,
  RotateCcw,
  GraduationCap,
  BookOpen,
  User,
  ChevronDown,
} from 'lucide-react'
import useAuthStore from '../stores/authStore'
import aiChatService, { getLocalGuestQuota } from '../services/aiChatService'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

export const AiChatWidget: React.FC = () => {
  const navigate = useNavigate()
  const authUser = useAuthStore((state: any) => state.user)

  // Xác định vai trò hiện tại
  const role: 'TEACHER' | 'STUDENT' | 'ADMIN' | 'GUEST' = authUser?.role
    ? authUser.role === 'TEACHER'
      ? 'TEACHER'
      : authUser.role === 'ADMIN'
        ? 'ADMIN'
        : 'STUDENT'
    : 'GUEST'

  const isGuest = role === 'GUEST'

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [remainingQuota, setRemainingQuota] = useState<number | null>(
    isGuest ? getLocalGuestQuota() : null
  )
  const [limitReached, setLimitReached] = useState<boolean>(
    isGuest ? getLocalGuestQuota() <= 0 : false
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Khởi tạo tin nhắn chào mừng theo vai trò
  useEffect(() => {
    let welcome = ''
    if (role === 'TEACHER') {
      welcome =
        'Xin chào Thầy/Cô! Tôi là Trợ lý Học tập AI của FrogH. Tôi sẵn sàng hỗ trợ Thầy/Cô xây dựng ma trận đề thi, soạn câu hỏi trắc nghiệm/tự luận, gợi ý ý tưởng bài giảng sáng tạo và giải đáp nghiệp vụ hệ thống. Thầy/Cô cần hỗ trợ nội dung nào ạ?'
    } else if (role === 'STUDENT') {
      welcome =
        'Xin chào bạn học sinh! Tôi là Trợ lý Học tập AI của FrogH. Tôi có thể cùng bạn ôn tập lý thuyết, hướng dẫn từng bước tư duy giải bài tập, giải thích công thức các môn học và tra cứu thông tin lớp học. Bạn đang có thắc mắc bài tập nào?'
    } else {
      welcome =
        'Xin chào bạn! Tôi là Trợ lý Học tập AI của hệ thống FrogH Education. Bạn có tối đa 3 lượt hỏi thử miễn phí về kiến thức các môn học hoặc tìm hiểu về hệ thống FrogH. Hãy đặt câu hỏi để trải nghiệm nhé!'
    }

    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: welcome,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }, [role])

  // Đồng bộ quota từ server khi mở widget hoặc khi auth thay đổi
  useEffect(() => {
    if (isGuest) {
      aiChatService
        .getQuotaStatus()
        .then((res) => {
          if (typeof res?.remainingQuota === 'number') {
            setRemainingQuota(res.remainingQuota)
            setLimitReached(res.limitReached || res.remainingQuota <= 0)
          }
        })
        .catch(() => {
          // Dùng giá trị từ localStorage
          const local = getLocalGuestQuota()
          setRemainingQuota(local)
          setLimitReached(local <= 0)
        })
    } else {
      setRemainingQuota(null)
      setLimitReached(false)
    }
  }, [isGuest, authUser])

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isLoading])

  // Focus ô nhập khi mở hộp thoại
  useEffect(() => {
    if (isOpen && !limitReached) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen, limitReached])

  // Danh sách câu hỏi gợi ý nhanh theo vai trò
  const quickPrompts =
    role === 'TEACHER'
      ? [
          'Gợi ý ma trận đề kiểm tra 15 phút môn Tin học',
          'Soạn 3 câu hỏi trắc nghiệm Toán phân hóa',
          'Phương pháp xây dựng bài giảng tích cực',
        ]
      : role === 'STUDENT'
        ? [
            'Giải thích định luật II Newton',
            'Phương pháp tìm nguyên hàm và tích phân',
            'Cách phân biệt thì Hiện tại hoàn thành và Quá khứ đơn',
          ]
        : [
            'Hệ thống FrogH có những tính năng học tập gì?',
            'Cách tra cứu lịch sử chuyên cần và điểm thi',
            'Giải thích khái niệm hàm số bậc hai',
          ]

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || isLoading) return

    if (isGuest && limitReached) {
      return
    }

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsLoading(true)

    // Chuẩn bị history (chỉ lấy role và content)
    const history = messages
      .filter((m) => m.id !== 'msg-welcome')
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const data = await aiChatService.sendMessage(text, history)

      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply || 'Xin lỗi, tôi chưa xử lý được câu hỏi này. Bạn vui lòng thử lại nhé!',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMsg])

      if (typeof data.remainingQuota === 'number') {
        setRemainingQuota(data.remainingQuota)
        setLimitReached(data.limitReached || data.remainingQuota <= 0)
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content:
          err.response?.data?.message ||
          'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại đường truyền mạng hoặc thử lại sau!',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleResetChat = () => {
    let welcome = ''
    if (role === 'TEACHER') {
      welcome =
        'Đoạn hội thoại đã được làm mới. Thầy/Cô cần hỗ trợ thêm nội dung học thuật hoặc soạn giáo án nào nữa không ạ?'
    } else if (role === 'STUDENT') {
      welcome =
        'Đoạn hội thoại đã được làm mới. Bạn cần hỗ trợ ôn tập hoặc giải đáp bài tập môn học nào tiếp theo?'
    } else {
      welcome =
        'Đoạn hội thoại đã được làm mới. Bạn có thể tiếp tục hỏi các nội dung học tập hoặc tìm hiểu về FrogH.'
    }

    setMessages([
      {
        id: 'msg-welcome-' + Date.now(),
        role: 'assistant',
        content: welcome,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* 1. KHUNG CHAT KHI MỞ */}
      {isOpen && (
        <div className="mb-3 flex h-[560px] max-h-[82vh] w-[360px] sm:w-[420px] flex-col overflow-hidden rounded-2xl border border-emerald-900/15 bg-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#0F3822] px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D8F3DC] text-[#0F3822] shadow-2xs">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Trợ lý Học tập AI</h4>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>

                {/* Badge trạng thái */}
                <div className="mt-0.5 flex items-center gap-1.5">
                  {role === 'TEACHER' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#D8F3DC] px-1.5 py-0.2 text-[10px] font-bold text-[#0F3822]">
                      <GraduationCap size={11} /> Chế độ Giáo viên
                    </span>
                  )}
                  {role === 'STUDENT' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#D8F3DC] px-1.5 py-0.2 text-[10px] font-bold text-[#0F3822]">
                      <BookOpen size={11} /> Chế độ Học sinh
                    </span>
                  )}
                  {isGuest && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                        limitReached
                          ? 'bg-red-500/20 text-red-200'
                          : 'bg-amber-400/20 text-amber-200'
                      }`}
                    >
                      <Sparkles size={11} />
                      {limitReached
                        ? 'Hết lượt hỏi thử'
                        : `Khách: Còn ${remainingQuota ?? 3}/3 lượt`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                type="button"
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="rounded-lg p-1.5 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="rounded-lg p-1.5 transition hover:bg-white/10 hover:text-white"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Body: Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto bg-[#F8FAF9] p-4 space-y-3.5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user'

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isUser
                        ? 'bg-[#0F3822] text-[#D8F3DC]'
                        : 'bg-[#D8F3DC] text-[#0F3822]'
                    }`}
                  >
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[82%]`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-line ${
                        isUser
                          ? 'rounded-tr-xs bg-[#0F3822] text-white'
                          : 'rounded-tl-xs border border-gray-100 bg-white text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="mt-1 px-1 text-[10px] text-gray-400">{msg.time}</span>
                  </div>
                </div>
              )
            })}

            {/* Hiệu ứng đang soạn phản hồi */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D8F3DC] text-[#0F3822]">
                  <Bot size={14} />
                </div>
                <div className="rounded-2xl rounded-tl-xs border border-gray-100 bg-white px-4 py-3 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts gợi ý (khi tin nhắn ít) */}
          {messages.length <= 3 && !limitReached && (
            <div className="border-t border-gray-100 bg-white px-3 py-2">
              <span className="block text-[11px] font-semibold text-gray-400 mb-1.5">
                💡 Gợi ý câu hỏi nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="truncate max-w-[100%] rounded-lg border border-emerald-900/10 bg-[#F8FAF9] px-2.5 py-1 text-left text-[11px] font-medium text-[#0F3822] transition hover:bg-[#D8F3DC] hover:text-[#0F3822]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer: Ô nhập hoặc Khung thông báo hết lượt */}
          {isGuest && limitReached ? (
            <div className="border-t border-red-100 bg-red-50/70 p-4 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
                <Lock size={18} />
              </div>
              <h5 className="text-xs font-bold text-red-800">
                Bạn đã sử dụng hết 3 lượt hỏi thử miễn phí
              </h5>
              <p className="mt-1 text-[11px] text-gray-600">
                Vui lòng đăng nhập tài khoản Học sinh hoặc Giáo viên để tiếp tục trò chuyện không giới hạn.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0F3822] px-4 py-2 text-xs font-bold text-[#D8F3DC] shadow-md transition hover:bg-[#165132]"
              >
                <span>Đăng nhập ngay</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-100 bg-white p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi về bài học, định nghĩa, bài tập..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-gray-200 bg-[#F8FAF9] px-3.5 py-2 text-xs sm:text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-[#10B981] focus:bg-white focus:ring-1 focus:ring-[#10B981] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="Gửi tin nhắn"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F3822] text-[#D8F3DC] transition hover:bg-[#165132] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={15} />
                </button>
              </div>

              {isGuest && (
                <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-gray-400">
                  <span>Chế độ Khách trải nghiệm</span>
                  <span>Còn {remainingQuota ?? 3}/3 lượt</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. NÚT TRÒN NỔI (FLOATING BUTTON) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Mở Trợ lý Học tập AI"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0F3822] text-[#D8F3DC] shadow-xl ring-4 ring-[#D8F3DC]/60 transition-all duration-300 hover:scale-105 hover:bg-[#165132] hover:shadow-2xl active:scale-95"
      >
        {isOpen ? (
          <X size={26} className="transition-transform duration-200" />
        ) : (
          <>
            <Bot size={28} className="transition-transform group-hover:rotate-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#10B981] text-[9px] font-extrabold text-white items-center justify-center">
                ✨
              </span>
            </span>
          </>
        )}

        {/* Tooltip khi chưa mở */}
        {!isOpen && (
          <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#0F3822] px-3 py-1.5 text-xs font-semibold text-white shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Trợ lý Học tập AI
          </span>
        )}
      </button>
    </div>
  )
}

export default AiChatWidget

