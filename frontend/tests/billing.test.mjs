import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

let api, billingService, resourceOptions

before(async () => {
  api = {
    get: (...args) => api.handler('GET', ...args),
    post: (...args) => api.handler('POST', ...args),
  }
  const source = await readFile(new URL('../src/services/billingService.js', import.meta.url), 'utf8')
  billingService = runInNewContext(source.replace("import api from './api'", '').replace('export default billingService', 'billingService'), { api })
  const querySource = await readFile(new URL('../src/query/resourceOptions.js', import.meta.url), 'utf8')
  const queryContext = {
    classroomService: {}, userService: {}, attendanceService: {}, lessonService: {},
    notificationService: {}, requestService: {}, examService: {}, subjectService: {},
    materialService: {}, billingService,
  }
  resourceOptions = runInNewContext(querySource
    .replace(/^import .* from .*$/gm, '')
    .replace('export function resourceOptions', 'function resourceOptions')
    .concat('\nresourceOptions'), queryContext)
})

test('billing reads share abort signals and writes send only product and idempotency IDs', async () => {
  const signal = new AbortController().signal
  const overview = { pointsBalance: 50 }
  const order = { orderId: 'order-1', status: 'PENDING' }
  api.handler = async (method, path, body, options) => {
    if (method === 'GET' && path === '/billing/me') {
      assert.equal(body.signal, signal)
      return { data: overview }
    }
    if (method === 'GET' && path === '/billing/orders/order-1') {
      assert.equal(body.signal, signal)
      return { data: order }
    }
    if (method === 'POST' && path === '/billing/orders') {
      assert.deepEqual(JSON.parse(JSON.stringify(body)), { productCode: 'points-50', requestId: 'request-1' })
      assert.equal(options.skipQueryInvalidation, true)
      return { data: order }
    }
    if (method === 'POST' && path === '/billing/vip/redeem') {
      assert.deepEqual(JSON.parse(JSON.stringify(body)), { productCode: 'vip-personal-1m', requestId: 'redeem-1' })
      assert.equal(options.skipQueryInvalidation, true)
      return { data: overview }
    }
    throw new Error(`Unexpected billing call: ${method} ${path}`)
  }

  assert.equal(await billingService.getOverview({ signal }), overview)
  assert.equal(await billingService.getOrder('order-1', { signal }), order)
  assert.equal(await billingService.createOrder('points-50', 'request-1'), order)
  assert.equal(await billingService.redeemVip('vip-personal-1m', 'redeem-1'), overview)
})

test('billing status polls while pending and stops after settlement', () => {
  const options = resourceOptions('billingOrder', ['order-1'])
  assert.equal(options.refetchInterval({ state: { data: { status: 'PENDING' } } }), 10000)
  assert.equal(options.refetchInterval({ state: { data: { status: 'CREATING' } } }), 10000)
  assert.equal(options.refetchInterval({ state: { data: { status: 'PAID' } } }), false)
})