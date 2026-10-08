import { useNavigate } from 'react-router-dom'

export default function ExamSaveStatus({ config, message, uncertain, saving, onConfirmRetry }) {
  const navigate = useNavigate()
  const target = config.accessType === 'CLASS' ? `${config.classIds?.length ?? 0} lớp` : config.accessType === 'STUDENT' ? `${config.studentIds?.length ?? 0} học sinh` : 'Tất cả học sinh thuộc các lớp của bạn'
  return (
    <div className="mb-3 space-y-2">
      <p className="text-sm text-slate-600">Giao đề cho: <strong>{target}</strong>. Đề được lưu ở trạng thái nháp.</p>
      {(message || uncertain) && <div role="alert" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p>{message || 'Lần lưu trước chưa rõ kết quả. Kiểm tra danh sách đề trước khi gửi lại.'}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={saving} onClick={() => navigate('/teacher/exams/create')} className="font-semibold underline">Quay lại cấu hình</button>
          {uncertain && <>
            <button type="button" onClick={() => navigate('/teacher/exams')} className="font-semibold underline">Kiểm tra danh sách đề</button>
            <button type="button" onClick={onConfirmRetry} className="font-semibold underline">Đã kiểm tra, cho phép lưu lại</button>
          </>}
        </div>
      </div>}
    </div>
  )
}
