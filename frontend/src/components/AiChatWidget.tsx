import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Bot,
  Sparkles,
  X,
  Send,
  Lock,
  Trash2,
  GraduationCap,
  BookOpen,
  User,
  ChevronDown,
} from 'lucide-react'
import useAuthStore from '../stores/authStore'
import { sendChatMessage, getQuotaStatus, getLocalGuestQuota } from '../services/aiChatService'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  text?: string
  time: string
}

const STORAGE_KEY = 'ai_chat_messages'

const getWelcomeMessage = (currentRole: string): ChatMessage => {
  let welcome = ''
  if (currentRole === 'TEACHER') {
    welcome =
      'Xin chào Thầy/Cô! Tôi là Trợ lý Học tập AI của FrogH. Tôi sẵn sàng hỗ trợ Thầy/Cô xây dựng ma trận đề thi, soạn câu hỏi trắc nghiệm/tự luận, gợi ý ý tưởng bài giảng sáng tạo và giải đáp nghiệp vụ hệ thống. Thầy/Cô cần hỗ trợ nội dung nào ạ?'
  } else if (currentRole === 'STUDENT') {
    welcome =
      'Xin chào bạn học sinh! Tôi là Trợ lý Học tập AI của FrogH. Tôi có thể cùng bạn ôn tập lý thuyết, hướng dẫn từng bước tư duy giải bài tập, giải thích công thức các môn học và tra cứu thông tin lớp học. Bạn đang có thắc mắc bài tập nào?'
  } else {
    welcome =
      'Xin chào bạn! Tôi là Trợ lý Học tập AI của hệ thống FrogH Education. Bạn có tối đa 3 lượt hỏi thử miễn phí về kiến thức các môn học hoặc tìm hiểu về hệ thống FrogH. Hãy đặt câu hỏi để trải nghiệm nhé!'
  }

  return {
    id: 'msg-welcome',
    role: 'assistant',
    content: welcome,
    text: welcome,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  }
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

  // Khôi phục lịch sử chat từ localStorage nếu có
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Lỗi khi đọc lịch sử chat từ localStorage:', e)
    }
    return [getWelcomeMessage(role)]
  })

  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [remainingQuota, setRemainingQuota] = useState<number | null>(
    isGuest ? getLocalGuestQuota() : null
  )
  const [limitReached, setLimitReached] = useState<boolean>(
    isGuest ? getLocalGuestQuota() <= 0 : false
  )
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Lưu lịch sử chat vào localStorage mỗi khi messages thay đổi
  useEffect(() => {
    if (messages && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      } catch (e) {
        console.error('Lỗi khi lưu lịch sử chat vào localStorage:', e)
      }
    }
  }, [messages])

  // Đồng bộ quota từ server khi mở widget hoặc khi auth thay đổi
  useEffect(() => {
    if (isGuest) {
      getQuotaStatus()
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

    if (showQuickPrompts) {
      setShowQuickPrompts(false)
    }

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      text: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInputMessage('')
    setIsLoading(true)

    // Giữ lại tối đa 10 tin nhắn gần nhất có text và role để truyền context vào API
    const history = messages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && (m.content || m.text))
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: (m.content || m.text || '').trim(),
      }))

    try {
      const data = await sendChatMessage(text, history)

      const replyContent =
        data.reply || 'Xin lỗi, tôi chưa xử lý được câu hỏi này. Bạn vui lòng thử lại nhé!'

      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: replyContent,
        text: replyContent,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMsg])

      if (typeof data.remainingQuota === 'number') {
        setRemainingQuota(data.remainingQuota)
        setLimitReached(data.limitReached || data.remainingQuota <= 0)
      }
    } catch (err: any) {
      const errorText =
        err.response?.data?.message ||
        'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại đường truyền mạng hoặc thử lại sau!'

      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: errorText,
        text: errorText,
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

  // Xoá lịch sử trò chuyện (clear localStorage và đặt state messages về câu chào ban đầu)
  const handleClearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Lỗi khi xoá lịch sử chat từ localStorage:', e)
    }
    setMessages([getWelcomeMessage(role)])
    setShowQuickPrompts(true)
  }

  return (
    <div className="fixed bottom-28 right-6 z-50 flex flex-col items-end select-none">
      {/* 1. KHUNG CHAT KHI MỞ */}
      {isOpen && (
        <div className="mb-3 flex h-[580px] max-h-[calc(100dvh-12rem)] w-[360px] sm:w-[440px] flex-col overflow-hidden rounded-2xl border border-emerald-900/15 bg-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
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
              {/* Nút Xoá lịch sử */}
              <button
                type="button"
                onClick={handleClearHistory}
                title="Xoá lịch sử trò chuyện"
                aria-label="Xoá lịch sử trò chuyện"
                className="rounded-lg p-1.5 transition hover:bg-white/10 hover:text-white"
              >
                <Trash2 size={16} />
              </button>
              {/* Nút Thu nhỏ */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                aria-label="Thu nhỏ"
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
              const textContent = msg.content || msg.text || ''

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

                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        isUser
                          ? 'rounded-tr-xs bg-[#0F3822] text-white whitespace-pre-line'
                          : 'rounded-tl-xs border border-gray-100 bg-white text-gray-800'
                      }`}
                    >
                      {isUser ? (
                        textContent
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>
                              ),
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                              strong: ({ children }) => (
                                <strong className="font-bold text-[#0F3822]">{children}</strong>
                              ),
                              code: ({ inline, className, children, ...props }: any) => {
                                return inline ? (
                                  <code
                                    className="rounded bg-emerald-100/70 px-1 py-0.5 font-mono text-[11px] font-semibold text-[#0F3822]"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ) : (
                                  <pre className="my-2 overflow-x-auto rounded-xl bg-gray-900 p-3 font-mono text-xs text-gray-100 shadow-inner">
                                    <code {...props}>{children}</code>
                                  </pre>
                                )
                              },
                              table: ({ children }) => (
                                <div className="my-2 overflow-x-auto rounded-lg border border-gray-200">
                                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="bg-emerald-50 px-2.5 py-1.5 text-left font-bold text-[#0F3822]">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border-t border-gray-100 px-2.5 py-1.5 text-gray-700">
                                  {children}
                                </td>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="my-2 border-l-2 border-emerald-600 pl-2.5 italic text-gray-600">
                                  {children}
                                </blockquote>
                              ),
                              h1: ({ children }) => (
                                <h1 className="mb-2 mt-1 text-base font-bold text-[#0F3822]">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="mb-1.5 mt-1 text-sm font-bold text-[#0F3822]">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="mb-1 text-xs font-bold text-[#0F3822]">
                                  {children}
                                </h3>
                              ),
                            }}
                          >
                            {textContent}
                          </ReactMarkdown>
                        </div>
                      )}
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

          {/* Quick Prompts gợi ý */}
          {showQuickPrompts && !limitReached && quickPrompts.length > 0 && (
            <div className="relative border-t border-gray-100 bg-white px-3 py-2">
              <button
                type="button"
                onClick={() => setShowQuickPrompts(false)}
                title="Đóng gợi ý"
                aria-label="Đóng gợi ý"
                className="absolute top-2 right-2 rounded-md p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={14} />
              </button>

              <span className="block text-[11px] font-semibold text-gray-400 mb-1.5 pr-6">
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
