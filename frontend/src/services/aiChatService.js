import api from './api'

const SESSION_KEY = 'frogh_ai_client_session_id'
const GUEST_QUOTA_KEY = 'frogh_ai_guest_quota'

/**
 * Lấy hoặc khởi tạo Client Session ID duy nhất cho khách vãng lai
 * @returns {string}
 */
export function getOrCreateClientSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

/**
 * Lấy số lượt dùng thử còn lại lưu ở Frontend
 * @returns {number}
 */
export function getLocalGuestQuota() {
  const raw = localStorage.getItem(GUEST_QUOTA_KEY)
  if (raw === null || raw === undefined) return 3
  const parsed = parseInt(raw, 10)
  return isNaN(parsed) ? 3 : parsed
}

/**
 * Cập nhật số lượt dùng thử của khách vào localStorage
 * @param {number} quota
 */
export function setLocalGuestQuota(quota) {
  if (typeof quota === 'number') {
    localStorage.setItem(GUEST_QUOTA_KEY, String(quota))
  }
}

export const aiChatService = {
  /**
   * Gửi tin nhắn câu hỏi tới Trợ lý Học tập AI
   * @param {string} message Nội dung câu hỏi
   * @param {Array<{role: string, content: string}>} history Lịch sử trò chuyện
   * @returns {Promise<{reply: string, remainingQuota: number|null, limitReached: boolean, role: string}>}
   */
  sendMessage: async (message, history = []) => {
    const clientSessionId = getOrCreateClientSessionId()
    const response = await api.post('/public/ai/chat', {
      message,
      history,
      clientSessionId,
    })

    if (typeof response.data?.remainingQuota === 'number') {
      setLocalGuestQuota(response.data.remainingQuota)
    }

    return response.data
  },

  /**
   * Lấy trạng thái hạn mức quota và vai trò người dùng hiện tại
   * @returns {Promise<{reply: string, remainingQuota: number|null, limitReached: boolean, role: string}>}
   */
  getQuotaStatus: async () => {
    const clientSessionId = getOrCreateClientSessionId()
    const response = await api.get('/public/ai/quota', {
      params: { clientSessionId },
    })

    if (typeof response.data?.remainingQuota === 'number') {
      setLocalGuestQuota(response.data.remainingQuota)
    }

    return response.data
  },
}

export default aiChatService

