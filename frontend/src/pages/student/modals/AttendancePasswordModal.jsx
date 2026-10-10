import { useEffect, useState } from 'react'
import { ClipboardCheck, X } from 'lucide-react'

export default function AttendancePasswordModal({ onClose, onSubmit, busy, error }) {
  const [password, setPassword] = useState('')

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="attendance-password-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="attendance-password-title" className="flex items-center gap-2 text-xl font-bold text-[#18301D]"><ClipboardCheck size={23} className="text-green-600" />Điểm danh</h2>
          <button type="button" onClick={onClose} aria-label="Đóng điểm danh" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <label htmlFor="attendance-password" className="mb-2 block text-sm font-semibold text-[#18301D]">Mật khẩu điểm danh</label>
        <input autoFocus id="attendance-password" type="password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu giáo viên cung cấp..." className="w-full rounded-xl border border-emerald-100 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100" />
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end">
          <button type="button" disabled={busy || !password} onClick={() => onSubmit(password)} className="mr-3 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang điểm danh...' : 'Điểm danh'}</button>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-500 hover:bg-red-500 hover:text-white">Đóng</button>
        </div>
      </section>
    </div>
  )
}
