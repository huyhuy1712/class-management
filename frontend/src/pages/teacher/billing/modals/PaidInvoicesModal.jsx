import { CalendarDays, Check, CreditCard, ReceiptText, X } from 'lucide-react'

const money = (amount) => new Intl.NumberFormat('vi-VN').format(amount)
const dateLabel = (value) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : '--'
function PaidInvoicesModal({ open, onClose, invoices, isLoading }) {
  if (!open) return null

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose()
  }}>
    <section className="w-full max-w-2xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl ring-1 ring-white/70" role="dialog" aria-modal="true" aria-labelledby="paid-invoices-title">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-6 text-white sm:px-7">
        <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-20 h-48 w-48 rounded-full bg-teal-300/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><ReceiptText size={22} /></div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Lịch sử thanh toán</p>
            <h2 id="paid-invoices-title" className="mt-1 text-2xl font-bold tracking-tight">Hóa đơn đã thanh toán</h2>
            <p className="mt-1 text-sm text-emerald-100">Theo dõi các giao dịch VIP và Point của bạn.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/70 transition hover:bg-white/15 hover:text-white" aria-label="Đóng"><X size={21} /></button>
        </div>
      </div>
      <div className="border-b border-slate-200 bg-white px-6 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tổng giao dịch</p><p className="mt-1 text-xl font-bold text-slate-900">{invoices.length} <span className="text-sm font-medium text-slate-500">hóa đơn</span></p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Check size={19} /></div>
        </div>
      </div>
      <div className="max-h-[55vh] overflow-y-auto px-6 py-5 sm:px-7">
        <div className="space-y-3">
          {isLoading ? <p className="py-8 text-center text-sm text-slate-500">Đang tải hóa đơn...</p> : invoices.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Chưa có hóa đơn đã thanh toán.</p> : invoices.map((invoice) => <article key={invoice.id} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5">
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
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:px-7">
        <p className="text-xs text-slate-400">Hóa đơn được tạo sau khi MoMo xác nhận thanh toán.</p>
        <button type="button" onClick={onClose} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 hover:shadow-md">Đóng</button>
      </div>
    </section>
  </div>
}

export default PaidInvoicesModal
