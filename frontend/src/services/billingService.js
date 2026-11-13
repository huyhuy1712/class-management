import api from './api'

const billingService = {
  getOverview: async (options = {}) => (await api.get('/billing/me', options)).data,
  getMissions: async (options = {}) => (await api.get('/billing/missions', options)).data,
  claimMission: async (missionCode) => (await api.post(`/billing/missions/${missionCode}/claim`, null, { skipQueryInvalidation: true })).data,
  getOrder: async (orderId, options = {}) => (await api.get(`/billing/orders/${orderId}`, options)).data,
  getInvoices: async (options = {}) => (await api.get('/billing/invoices', options)).data,
  createOrder: async (productCode, requestId) => (await api.post(
    '/billing/orders',
    { productCode, requestId },
    { skipQueryInvalidation: true },
  )).data,
  redeemVip: async (productCode, requestId) => (await api.post(
    '/billing/vip/redeem',
    { productCode, requestId },
    { skipQueryInvalidation: true },
  )).data,
}

export default billingService