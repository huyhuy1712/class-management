import { CreditCard, ShieldCheck, X } from 'lucide-react'

const money = (amount) => new Intl.NumberFormat('vi-VN').format(amount)

function VnpayPaymentModal({ product, onClose }) {
  if (!product) return null

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose()
  }}>
    <section className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/70 sm:max-h-[calc(100dvh-2rem)]" role="dialog" aria-modal="true" aria-labelledby="vnpay-payment-title">
      <div className="flex shrink-0 items-start justify-between bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 px-4 py-4 text-white sm:px-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Thanh toán VNPay</p>
          <h2 id="vnpay-payment-title" className="mt-1 text-xl font-bold">Mua {product.name}</h2>
          <p className="mt-1 text-sm text-blue-100">Bạn sẽ được chuyển sang cổng thanh toán VNPay trong tab hiện tại.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/80 transition hover:bg-white/15 hover:text-white" aria-label="Đóng">
          <X size={21} />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Số tiền thanh toán</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{money(product.amountVnd)} <span className="text-sm font-bold text-slate-500">VND</span></p>
          </div>
          <CreditCard className="text-blue-700" size={24} />
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
          <p className="font-bold text-slate-900">Thanh toán an toàn qua VNPay</p>
          <p className="mt-1">VNPay tạo phiên thanh toán riêng cho đơn hàng này; bạn có thể chọn ngân hàng hoặc quét mã VNPay-QR.</p>
          <a href={product.payUrl} className="mt-3 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 font-bold text-white transition hover:bg-blue-800">
            Tiếp tục đến VNPay
          </a>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <p className="font-bold text-slate-900">Hướng dẫn thanh toán</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            <li>Nhấn “Tiếp tục đến VNPay”; sau khi thanh toán, VNPay sẽ quay lại tab này.</li>
            <li>Kiểm tra đúng số tiền {money(product.amountVnd)} VND.</li>
            <li>Giữ nguyên tab trong suốt quá trình thanh toán.</li>
          </ol>
        </div>
        <p className="flex items-start gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />Giao dịch sẽ được ghi nhận sau khi hệ thống xác nhận thanh toán thành công.</p>
      </div>
      <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
        <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Đóng</button>
      </div>
    </section>
  </div>
}

export default VnpayPaymentModal
