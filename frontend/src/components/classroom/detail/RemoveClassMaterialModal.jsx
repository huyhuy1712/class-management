export default function RemoveClassMaterialModal({ material, removing, onClose, onConfirm }) {
  if (!material) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="remove-class-material-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="remove-class-material-title" className="text-lg font-bold text-slate-900">Gỡ tài liệu khỏi lớp?</h2>
        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
          “{material.title}” sẽ không còn được phân phối cho lớp này. Bản gốc vẫn được giữ trong kho tài liệu; nếu đây là đích nhận cuối cùng, chỉ thông tin phân phối sẽ bị xóa.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" disabled={removing} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">Hủy</button>
          <button type="button" disabled={removing} onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {removing ? 'Đang gỡ...' : 'Gỡ khỏi lớp'}
          </button>
        </div>
      </section>
    </div>
  )
}
