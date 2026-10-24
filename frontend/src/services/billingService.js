import api from './api'

const billingService = {
  getOverview: async (options = {}) => (await api.get('/billing/me', options)).data,
  getOrder: async (orderId, options = {}) => (await api.get(`/billing/orders/${orderId}`, options)).data,
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