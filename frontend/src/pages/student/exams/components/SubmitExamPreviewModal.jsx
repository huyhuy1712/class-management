import { Modal } from 'antd'

export default function SubmitExamPreviewModal({ open, onClose, onSubmit, unanswered }) {
  return <Modal open={open} onCancel={onClose} title="Xác nhận nộp bài mẫu" footer={null} centered>
    <p className="my-4 text-slate-600">{unanswered ? `Bạn còn ${unanswered} câu chưa trả lời đầy đủ. Bạn muốn nộp bài?` : 'Bạn đã trả lời tất cả các câu. Bạn muốn nộp bài?'}</p>
    <p className="text-sm text-slate-500">Đây là bản thử giao diện, không gửi bài hay tính điểm trên máy chủ.</p>
    <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2">Làm tiếp</button><button type="button" onClick={onSubmit} className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">Nộp bài mẫu</button></div>
  </Modal>
}
