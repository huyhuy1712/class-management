import { Bell, CheckCircle2, Clock3, X } from 'lucide-react'

export default function StudentNotificationsModal({ notifications, loading, error, actionError, busy, onRead, onDelete, onDeleteAll, onClose }) {
  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="student-notifications-title" className="flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Bell size={21} />
            </span>
            <div>
              <h2 id="student-notifications-title" className="text-xl font-bold text-slate-900">Thông báo</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount ? `${unreadCount} thông báo chưa đọc` : 'Cập nhật mới nhất của bạn'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng thông báo" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button>
        </header>
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <span className="text-sm font-bold text-slate-700">Thông báo của bạn</span>
          <button type="button" disabled={busy || loading || !notifications.length} onClick={onDeleteAll} className="text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:text-slate-400">Xóa toàn bộ</button>
        </div>
        <div className="space-y-3 overflow-y-auto bg-slate-50/40 p-5">
          {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}
          {loading ? <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Đang tải thông báo...</p> : error ? <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</p> : notifications.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center"><Bell className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-700">Bạn chưa có thông báo</p><p className="mt-1 text-sm text-slate-500">Các cập nhật về lớp học sẽ hiển thị tại đây.</p></div> : notifications.map((item) => (
            <article key={item.id} className={`flex gap-3 rounded-2xl border p-4 transition ${item.read ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50/70 shadow-sm shadow-emerald-900/5'}`}>
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.read ? 'bg-slate-100 text-slate-500' : 'bg-white text-emerald-600'}`}>
                {item.read ? <Clock3 size={17} /> : <CheckCircle2 size={17} />}
              </span>
              <button type="button" disabled={busy} onClick={() => onRead(item)} className="min-w-0 flex-1 text-left disabled:cursor-wait">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold leading-5 text-slate-900">{item.title}</h3>
                  {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Chưa đọc" />}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{item.message}</p>
                {item.createdAt && <p className="mt-2 text-xs font-medium text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>}
              </button>
              <button type="button" disabled={busy} onClick={() => onDelete(item.id)} aria-label="Xóa thông báo" className="self-start rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed"><X size={17} /></button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
