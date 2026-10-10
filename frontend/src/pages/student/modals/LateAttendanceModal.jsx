import { useState } from 'react'

export default function LateAttendanceModal({ onClose, onSubmit, busy, error }) {
  const [reason, setReason] = useState('')
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <form role="dialog" aria-modal="true" aria-labelledby="late-title" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); if (reason.trim()) onSubmit(reason.trim()) }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h2 id="late-title" className="text-xl font-bold text-[#18301D]">Bạn đã đi trễ buổi này</h2>
      <label htmlFor="late-reason" className="mb-2 mt-4 block text-sm font-semibold">Hãy nhập lý do trễ</label>
      <textarea autoFocus required id="late-reason" rows={4} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="w-full resize-y rounded-xl border border-emerald-200 p-3 outline-none focus:ring-2 focus:ring-green-100" />
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2 hover:bg-red-500 hover:text-white">Đóng</button><button type="submit" disabled={busy || !reason.trim()} className="rounded-xl bg-green-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Đang gửi...' : 'Xác nhận điểm danh'}</button></div>
    </form>
  </div>
}
