import FrogLoading from '../../../../utils/FrogLoading'
import { Modal } from 'antd'

export default function SubmitExamModal({ open, onClose, onSubmit, unanswered, submitting }) {
  return <Modal open={open} onCancel={() => { if (!submitting) onClose() }} closable={!submitting} maskClosable={!submitting} keyboard={!submitting} title="Xác nhận nộp bài" footer={null} centered>
    <p className="my-4 text-slate-600">{unanswered ? `Còn ${unanswered} mục chưa trả lời đầy đủ. Bạn vẫn muốn nộp bài?` : 'Bạn đã trả lời đầy đủ. Bạn muốn nộp bài?'}</p>
    <p className="text-sm text-slate-500">Sau khi nộp thành công, bạn không thể sửa đáp án của lượt này.</p>
    <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={submitting} onClick={onClose} className="rounded-xl border px-4 py-2">Làm tiếp</button><button type="button" disabled={submitting} onClick={onSubmit} className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{submitting ? <FrogLoading compact label="Đang nộp..." /> : 'Nộp bài'}</button></div>
  </Modal>
}
