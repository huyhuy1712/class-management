import { useState } from 'react'
import { ArrowLeft, CalendarDays, Check, CircleAlert, CreditCard, FileText, LoaderCircle, ReceiptText, Search, X } from 'lucide-react'
import useResourceQuery from '../../../../query/useResourceQuery'

const money = (amount) => new Intl.NumberFormat('vi-VN').format(amount)
const dateLabel = (value) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : '--'

const localDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function PaidInvoicesModal({ open, onClose, invoices, isLoading }) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const detail = useResourceQuery('billingInvoice', [selectedInvoiceId], { enabled: open && Boolean(selectedInvoiceId) })

  const normalizedSearch = search.trim().toLocaleLowerCase('vi')
  const filteredInvoices = invoices.filter((invoice) => {
    const searchable = [
      invoice.invoiceNumber,
      invoice.paymentMethod,
      ...(invoice.items ?? []).map((item) => item.productName),
    ].filter(Boolean).join(' ').toLocaleLowerCase('vi')
    const paidDate = localDateInput(invoice.paidAt)
    return (!normalizedSearch || searchable.includes(normalizedSearch))
      && (!dateFrom || paidDate >= dateFrom)
      && (!dateTo || paidDate <= dateTo)
  })

  if (!open) return null

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-2 backdrop-blur-sm sm:p-4" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose()
  }}>
    <section className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl ring-1 ring-white/70 sm:max-h-[calc(100dvh-2rem)]" role="dialog" aria-modal="true" aria-labelledby="paid-invoices-title">
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-6 text-white sm:px-7">
        <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-20 h-48 w-48 rounded-full bg-teal-300/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><ReceiptText size={22} /></div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Lịch sử thanh toán</p>
            <h2 id="paid-invoices-title" className="mt-1 text-2xl font-bold tracking-tight">{selectedInvoiceId ? 'Chi tiết hóa đơn' : 'Hóa đơn đã thanh toán'}</h2>
            <p className="mt-1 text-sm text-emerald-100">{selectedInvoiceId ? 'Thông tin giao dịch và sản phẩm đã thanh toán.' : 'Theo dõi các giao dịch VIP và Point của bạn.'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/70 transition hover:bg-white/15 hover:text-white" aria-label="Đóng"><X size={21} /></button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className={`flex h-full w-[200%] transition-transform duration-300 ease-in-out motion-reduce:transition-none ${selectedInvoiceId ? '-translate-x-1/2' : 'translate-x-0'}`}>
          <div aria-hidden={Boolean(selectedInvoiceId)} inert={Boolean(selectedInvoiceId)} className="flex h-full w-1/2 min-w-0 flex-col">
            <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kết quả phù hợp</p><p className="mt-1 text-xl font-bold text-slate-900">{filteredInvoices.length} <span className="text-sm font-medium text-slate-500">/ {invoices.length} hóa đơn</span></p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Check size={19} /></div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <label className="relative block">
                  <span className="sr-only">Tìm hóa đơn</span>
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã hóa đơn, gói..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="text-xs text-slate-500">
                  <span className="mb-1 block">Từ ngày</span>
                  <input aria-label="Từ ngày" type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="text-xs text-slate-500">
                  <span className="mb-1 block">Đến ngày</span>
                  <input aria-label="Đến ngày" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7">
              <div className="space-y-3">
                {isLoading ? <p className="py-8 text-center text-sm text-slate-500">Đang tải hóa đơn...</p> : invoices.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Chưa có hóa đơn đã thanh toán.</p> : filteredInvoices.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy hóa đơn phù hợp.</p> : filteredInvoices.map((invoice) => <article
                  key={invoice.id}
                  role="button"
                  tabIndex={selectedInvoiceId ? -1 : 0}
                  aria-label={`Xem chi tiết hóa đơn ${invoice.invoiceNumber}`}
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedInvoiceId(invoice.id)
                    }
                  }}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CreditCard size={20} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><p className="font-bold text-slate-900">{invoice.items?.[0]?.productName ?? 'Giao dịch thanh toán'}</p><p className="mt-1 text-xs font-medium text-slate-400">{invoice.invoiceNumber}</p></div>
                        <div className="text-right"><p className="text-lg font-extrabold text-emerald-700">{money(invoice.totalVnd)} <span className="text-xs font-bold">VND</span></p><span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><Check size={12} /> Đã thanh toán</span></div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-400" />{dateLabel(invoice.paidAt)}</span>
                        <span className="inline-flex items-center gap-1.5"><CreditCard size={14} className="text-slate-400" />{invoice.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </article>)}
              </div>
            </div>
          </div>
          <div aria-hidden={!selectedInvoiceId} inert={!selectedInvoiceId} className="h-full w-1/2 min-w-0 overflow-y-auto px-6 py-5 sm:px-7">
            {selectedInvoiceId && <>
              <button type="button" onClick={() => setSelectedInvoiceId('')} className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"><ArrowLeft size={16} />Quay lại danh sách</button>
              {detail.isLoading ? <p className="py-10 text-center text-sm text-slate-500"><LoaderCircle size={18} className="mr-2 inline animate-spin" />Đang tải chi tiết hóa đơn...</p>
                : detail.isError ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><CircleAlert size={18} className="mr-2 inline" />{detail.error?.response?.data?.message || 'Không thể tải chi tiết hóa đơn.'}</div>
                  : detail.data && <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Số hóa đơn</p><p className="mt-1 font-bold text-slate-900">{detail.data.invoiceNumber}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><Check size={12} />{detail.data.status === 'ISSUED' ? 'Đã thanh toán' : detail.data.status}</span></div>
                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                        <p><span className="text-slate-500">Ngày thanh toán:</span> <strong className="text-slate-800">{dateLabel(detail.data.paidAt)}</strong></p>
                        <p><span className="text-slate-500">Phương thức:</span> <strong className="text-slate-800">{detail.data.paymentMethod}</strong></p>
                        <p><span className="text-slate-500">Khách hàng:</span> <strong className="text-slate-800">{detail.data.customerFullName || detail.data.customerUsername}</strong></p>
                        <p><span className="text-slate-500">Email:</span> <strong className="break-all text-slate-800">{detail.data.customerEmail || '--'}</strong></p>
                        <p className="break-all sm:col-span-2"><span className="text-slate-500">Mã giao dịch:</span> <strong className="text-slate-800">{detail.data.paymentTransactionId || '--'}</strong></p>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 px-5 py-3 font-bold text-slate-800">Sản phẩm</div>
                      {(detail.data.items ?? []).map((item, index) => <div key={`${item.productCode}-${index}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-0">
                        <div className="flex items-start gap-3"><FileText size={18} className="mt-0.5 text-emerald-700" /><div><p className="font-semibold text-slate-800">{item.productName}</p><p className="mt-1 text-xs text-slate-500">Số lượng: {item.quantity}{item.productType === 'VIP' ? ` · ${item.deviceLimit} thiết bị · ${item.durationMonths} tháng` : item.pointsGranted ? ` · ${item.pointsGranted} Point` : ''}</p></div></div>
                        <p className="font-bold text-slate-800">{money(item.lineTotalVnd)} VND</p>
                      </div>)}
                      <div className="space-y-2 bg-slate-50 px-5 py-4 text-sm">
                        <div className="flex justify-between text-slate-600"><span>Tạm tính</span><span>{money(detail.data.subtotalVnd)} VND</span></div>
                        <div className="flex justify-between text-slate-600"><span>Giảm giá</span><span>-{money(detail.data.discountVnd)} VND</span></div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-emerald-800"><span>Tổng thanh toán</span><span>{money(detail.data.totalVnd)} VND</span></div>
                      </div>
                    </div>
                  </div>}
            </>}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:px-7">
        <p className="text-xs text-slate-400">{selectedInvoiceId ? 'Chi tiết hóa đơn được tải khi bạn chọn hóa đơn.' : 'Hóa đơn được tạo sau khi VNPay xác nhận thanh toán.'}</p>
        <button type="button" onClick={onClose} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 hover:shadow-md">Đóng</button>
      </div>
    </section>
  </div>
}

export default PaidInvoicesModal
