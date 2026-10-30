import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, CircleAlert, Coins, Gem, LoaderCircle, RefreshCw, ShieldCheck, Smartphone, Sparkles } from 'lucide-react'
import DashboardLayout from '../../../layouts/DashboardLayout'
import billingService from '../../../services/billingService'
import useResourceQuery from '../../../query/useResourceQuery'
import useAuthStore from '../../../stores/authStore'
import { getSessionVersion } from '../../../query/queryClient'
import { accountScope } from '../../../query/queryKeys'

const money = (amount) => new Intl.NumberFormat('vi-VN').format(amount)
const tierLabel = (tier) => ({ PERSONAL: 'Cá nhân', FIVE_DEVICES: '5 thiết bị', TEN_DEVICES: '10 thiết bị' }[tier] ?? tier)
const dateLabel = (value) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : '--'

function TeacherBillingPage() {
  const user = useAuthStore((state) => state.user)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('orderId')
  const queryClient = useQueryClient()
  const overview = useResourceQuery('billing')
  const order = useResourceQuery('billingOrder', [orderId ?? ''], { enabled: Boolean(orderId) })
  const [actionError, setActionError] = useState('')
  const [busyProduct, setBusyProduct] = useState('')
  const [awaitingPayUrl, setAwaitingPayUrl] = useState(false)
  const [selectedMonths, setSelectedMonths] = useState(1)
  const account = accountScope(user, getSessionVersion())

  const checkout = useMutation({
    mutationFn: ({ productCode, requestId }) => billingService.createOrder(productCode, requestId),
    onError: (error) => setActionError(error.response?.data?.message || 'Không thể tạo yêu cầu thanh toán.'),
  })

  const redeem = useMutation({
    mutationFn: ({ productCode, requestId }) => billingService.redeemVip(productCode, requestId),
    onMutate: async ({ productCode }) => {
      await queryClient.cancelQueries({ queryKey: overview.queryKey, exact: true })
      const previous = queryClient.getQueryData(overview.queryKey)
      const product = previous?.products?.find((item) => item.code === productCode)
      if (previous && product) {
        queryClient.setQueryData(overview.queryKey, {
          ...previous,
          pointsBalance: Math.max(0, previous.pointsBalance - product.pointsRequired),
        })
      }
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) overview.setData(context.previous)
      setActionError(error.response?.data?.message || 'Không thể đổi point sang VIP.')
    },
    onSuccess: (data) => {
      overview.setData(data)
      setActionError('')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: overview.queryKey, exact: true })
    },
  })

  useEffect(() => {
    if (order.data?.status === 'PAID') {
      void queryClient.invalidateQueries({ queryKey: ['account', account, 'billing'], exact: true })
    }
    if (['PAID', 'FAILED', 'EXPIRED'].includes(order.data?.status)) {
      sessionStorage.removeItem(`billing-request:${user?.id}:${order.data.productCode}`)
    }
  }, [order.data?.status, order.data?.productCode, account, queryClient, user?.id])

  useEffect(() => {
    if (awaitingPayUrl && order.data?.status === 'PENDING' && order.data.payUrl) {
      setAwaitingPayUrl(false)
      window.location.assign(order.data.payUrl)
    }
  }, [awaitingPayUrl, order.data?.status, order.data?.payUrl])

  const requestStorageKey = (action, productCode) => `billing-${action}:${user?.id}:${productCode}`
  const createRequestId = (action, productCode) => {
    const key = requestStorageKey(action, productCode)
    let requestId = sessionStorage.getItem(key)
    if (!requestId) {
      requestId = crypto.randomUUID()
      sessionStorage.setItem(key, requestId)
    }
    return requestId
  }

  const startCheckout = async (product) => {
    if (checkout.isPending || redeem.isPending) return
    setBusyProduct(product.code)
    setActionError('')
    try {
      const result = await checkout.mutateAsync({ productCode: product.code, requestId: createRequestId('request', product.code) })
      if (['FAILED', 'EXPIRED'].includes(result.status)) {
        sessionStorage.removeItem(requestStorageKey('request', product.code))
        throw new Error('Đơn trước đã kết thúc. Hãy bấm thanh toán lần nữa để tạo đơn mới.')
      }
      if (!result.payUrl && result.orderId) {
        setAwaitingPayUrl(true)
        navigate(`/teacher/billing?orderId=${result.orderId}`, { replace: true })
        return
      }
      if (!result.payUrl) throw new Error('MoMo chưa trả về liên kết thanh toán. Hãy kiểm tra trạng thái đơn hàng.')
      window.location.assign(result.payUrl)
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || 'Không thể mở thanh toán MoMo.')
      setBusyProduct('')
    }
  }

  const redeemVip = (product) => {
    if (redeem.isPending || checkout.isPending) return
    setActionError('')
    setBusyProduct(product.code)
    redeem.mutate({ productCode: product.code, requestId: createRequestId('redeem', product.code) }, {
    onSuccess: () => sessionStorage.removeItem(requestStorageKey('redeem', product.code)),
      onSettled: () => setBusyProduct(''),
    })
  }

  const products = overview.data?.products ?? []
  const pointProducts = products.filter((product) => product.type === 'POINTS')
  const vipProducts = products.filter((product) => product.type === 'VIP' && product.durationMonths === selectedMonths)
  const pointBalance = overview.data?.pointsBalance ?? 0

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-0">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-emerald-100 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Tài khoản giáo viên</p>
            <h1 className="mt-1 text-2xl font-bold text-[#18301D]">VIP & Point</h1>
          </div>
          <button type="button" onClick={() => overview.refetch()} disabled={overview.isFetching} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw size={16} className={overview.isFetching ? 'animate-spin' : ''} /> Cập nhật
          </button>
        </div>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-orange-600"><Coins size={24} /></div>
            <div><p className="text-sm font-medium text-amber-900">Số dư Point</p><p className="mt-0.5 text-2xl font-bold text-orange-700">{overview.isLoading ? '...' : money(pointBalance)} <span className="text-sm">Point</span></p></div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-emerald-700"><Gem size={24} /></div>
            <div className="min-w-0"><p className="text-sm font-medium text-emerald-900">Quyền VIP hiện tại</p><p className="mt-0.5 truncate text-lg font-bold text-emerald-800">{overview.data?.vipTier ? `VIP ${tierLabel(overview.data.vipTier)}` : 'Gói miễn phí'}</p><p className="text-xs text-emerald-800/75">{overview.data?.vipTier ? `${overview.data.deviceLimit} thiết bị · đến ${dateLabel(overview.data.vipExpiresAt)}` : 'Nâng cấp để mở giới hạn sử dụng'}</p></div>
          </div>
        </section>

        {orderId && <section aria-live="polite" className={`mt-5 flex items-start gap-3 rounded-lg border p-4 ${order.data?.status === 'PAID' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : order.data?.status === 'FAILED' || order.data?.status === 'EXPIRED' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-sky-200 bg-sky-50 text-sky-900'}`}>
          {order.data?.status === 'PAID' ? <Check size={19} /> : order.data?.status === 'FAILED' || order.data?.status === 'EXPIRED' ? <CircleAlert size={19} /> : <LoaderCircle size={19} className="animate-spin" />}
          <div><p className="font-semibold">{order.isLoading ? 'Đang kiểm tra giao dịch...' : ({ PAID: 'Thanh toán thành công', FAILED: 'Giao dịch không thành công', EXPIRED: 'Đơn thanh toán đã hết hạn', PENDING: 'Đang chờ MoMo xác nhận', CREATING: 'Đang tạo yêu cầu thanh toán' }[order.data?.status] ?? 'Không tìm thấy trạng thái đơn hàng')}</p><p className="mt-0.5 text-sm">{order.data?.status === 'PAID' ? 'Số dư hoặc quyền VIP đã được cập nhật.' : 'Trạng thái sẽ tự đồng bộ sau khi MoMo gửi xác nhận.'}</p></div>
        </section>}

        {actionError && <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><CircleAlert size={18} className="mt-0.5 shrink-0" />{actionError}</div>}
        {overview.errorMessage && <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{overview.errorMessage}</div>}
        {overview.data && !overview.data.paymentEnabled && <div role="status" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Thanh toán MoMo đang chờ cấu hình merchant và webhook.</div>}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Gói VIP</h2><p className="mt-1 text-sm text-slate-500">Mua trực tiếp hoặc đổi bằng Point. 1 Point tương đương 980đ khi đổi VIP.</p></div><ShieldCheck size={22} className="text-emerald-700" /></div>
          <div role="group" aria-label="Chu kỳ thanh toán" className="grid grid-cols-1 gap-2 rounded-xl bg-[#2446B0] p-3 sm:grid-cols-3 sm:p-4">
            {[1, 3, 12].map((months) => {
              const cheapest = products.filter((product) => product.type === 'VIP' && product.durationMonths === months).sort((left, right) => left.amountVnd / months - right.amountVnd / months)[0]
              return <button key={months} type="button" aria-pressed={selectedMonths === months} onClick={() => setSelectedMonths(months)} className={`min-h-16 rounded-lg border px-4 py-3 text-left transition ${selectedMonths === months ? 'border-white bg-white text-slate-900' : 'border-white/20 bg-white/10 text-white hover:bg-white/15'}`}>
                <span className="block font-bold">{months} tháng</span>
                <span className={`mt-0.5 block text-xs ${selectedMonths === months ? 'text-slate-600' : 'text-white/80'}`}>{months === 1 ? 'Linh hoạt, gia hạn từng tháng' : `Trả một lần ${money(cheapest?.amountVnd ?? 0)} VND · từ ${money(Math.round((cheapest?.amountVnd ?? 0) / months))} VND/tháng`}</span>
              </button>
            })}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {vipProducts.map((product) => {
              const canRedeem = pointBalance >= product.pointsRequired
              const busy = busyProduct === product.code && (checkout.isPending || redeem.isPending)
              return <article key={product.code} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Smartphone size={20} /></span><div><h3 className="font-bold text-slate-900">{product.name}</h3><p className="text-sm text-slate-500">Dùng chung {product.deviceLimit} thiết bị · {product.durationMonths} tháng</p></div></div>{product.deviceLimit === 5 && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Phổ biến</span>}</div>
                <div className="mt-5 rounded-lg bg-emerald-50 p-4"><p className="text-xs font-bold uppercase text-emerald-800">Thanh toán MoMo</p><p className="mt-1 text-3xl font-extrabold text-emerald-900">{money(Math.round(product.amountVnd / product.durationMonths))} <span className="text-sm font-semibold">VND/tháng</span></p><p className="mt-1 text-xs text-slate-600">Mỗi kỳ thanh toán {money(product.amountVnd)} VND</p><p className="mt-2 border-t border-emerald-100 pt-2 text-sm text-slate-600">Hoặc đổi <strong className="text-slate-900">{money(product.pointsRequired)} Point</strong></p></div>
                <div className="mt-4 flex flex-1 flex-col gap-2 text-sm text-slate-600"><p className="flex items-center gap-2"><Check size={16} className="text-emerald-700" />Không giới hạn tạo lớp và đề thi</p><p className="flex items-center gap-2"><Check size={16} className="text-emerald-700" />Không giới hạn lượt thi và import</p><p className="flex items-center gap-2"><Check size={16} className="text-emerald-700" />Quyền sử dụng tối đa {product.deviceLimit} thiết bị</p></div>
                <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" disabled={!overview.data?.paymentEnabled || checkout.isPending || redeem.isPending} onClick={() => startCheckout(product)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{busy && checkout.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Gem size={16} />} Mua VIP</button><button type="button" disabled={!canRedeem || redeem.isPending || checkout.isPending} onClick={() => redeemVip(product)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50">{busy && redeem.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />} Đổi Point</button></div>
                {!canRedeem && <p className="mt-2 text-center text-xs text-slate-500">Còn thiếu {money(product.pointsRequired - pointBalance)} Point</p>}
              </article>
            })}
          </div>
        </section>

        <section className="mt-9 border-t border-slate-200 pt-7">
          <div className="mb-4"><h2 className="text-lg font-bold text-slate-900">Mua Point</h2><p className="mt-1 text-sm text-slate-500">Point dùng để đổi VIP và các tính năng tính phí theo lượt.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {pointProducts.map((product) => <article key={product.code} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-700"><Coins size={20} /></span><div><h3 className="font-bold text-slate-900">{product.pointsGranted} Point</h3><p className="text-sm text-slate-500">Nạp vào số dư Point</p></div></div><p className="mt-4 text-2xl font-extrabold text-orange-700">{money(product.amountVnd)} <span className="text-sm font-semibold">VND</span></p><button type="button" disabled={!overview.data?.paymentEnabled || checkout.isPending || redeem.isPending} onClick={() => startCheckout(product)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60">{busyProduct === product.code && checkout.isPending ? <LoaderCircle size={17} className="animate-spin" /> : <Coins size={17} />} Mua Point</button></article>)}
          </div>
        </section>

        <section className="mt-9 border-t border-slate-200 pt-7">
          <h2 className="text-lg font-bold text-slate-900">Lịch sử sử dụng Point</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {overview.data?.recentLedger?.length ? overview.data.recentLedger.map((entry, index) => <div key={`${entry.createdAt}-${index}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 last:border-0"><div><p className="text-sm font-semibold text-slate-800">{entry.reason.replaceAll('_', ' ')}</p><p className="text-xs text-slate-500">{dateLabel(entry.createdAt)}</p></div><div className="text-right"><p className={`font-bold ${entry.entryType === 'CREDIT' ? 'text-emerald-700' : 'text-orange-700'}`}>{entry.entryType === 'CREDIT' ? '+' : '-'}{money(entry.points)} Point</p><p className="text-xs text-slate-500">Còn {money(entry.balanceAfter)}</p></div></div>) : <p className="px-4 py-8 text-center text-sm text-slate-500">Chưa có giao dịch Point.</p>}
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} />Point được ghi nhận sau khi MoMo xác nhận giao dịch thành công.</p>
        </section>
        <a href="/teacher" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950"><ArrowLeft size={16} /> Về trang quản lý</a>
      </div>
    </DashboardLayout>
  )
}

export default TeacherBillingPage