import { AlertTriangle, X } from 'lucide-react'

function DeleteExamModal({ exam, open, deleting, forceRequired, error, onClose, onConfirm }) {
  if (!open || !exam) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500"><AlertTriangle size={21}/></div><button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">{forceRequired ? 'Đề thi đã có bài làm' : 'Xóa đề thi?'}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{forceRequired ? 'Xóa đề sẽ xóa toàn bộ bài làm và kết quả liên quan. Bạn có chắc muốn tiếp tục?' : <>Bạn có chắc muốn xóa <span className="font-semibold text-slate-700">“{exam.title}”</span>? Thao tác này không thể hoàn tác.</>}</p>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={deleting} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Hủy</button><button type="button" onClick={onConfirm} disabled={deleting} className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{deleting ? 'Đang xóa...' : forceRequired ? 'Vẫn xóa đề' : 'Xóa đề thi'}</button></div>
      </div>
    </div>
  )
}
export default DeleteExamModal
