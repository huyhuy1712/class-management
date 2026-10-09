import { Modal } from 'antd'

export default function ResumeExamDraftModal({ open, onClose, onContinue, onRestart }) {
  return <Modal centered open={open} onCancel={onClose} title="Bạn đang có đề thi chưa hoàn tất" footer={null} width={480}>
    <p className="mt-3 text-sm leading-6 text-slate-600">Hệ thống ghi nhận bạn đang tạo đề trước đó. Bạn muốn tiếp tục hay tạo lại?</p>
    <p className="mt-2 text-sm text-slate-500">Tạo lại sẽ xóa bản nháp đề đang lưu trên trình duyệt.</p>
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <button type="button" onClick={onRestart} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Tạo lại</button>
      <button type="button" onClick={onContinue} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Tiếp tục</button>
    </div>
  </Modal>
}
