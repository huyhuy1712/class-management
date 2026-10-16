import api from './api'

export const publicService = {
  /**
   * Tra cứu thông tin học sinh và danh sách lớp học công khai (không cần đăng nhập)
   * @param {string} studentCode Mã số học sinh
   * @returns {Promise<any>}
   */
  lookupStudentByCode: async (studentCode) => {
    const response = await api.get('/public/lookup/student', {
      params: { code: studentCode },
    })
    return response.data
  },
}

export default publicService

