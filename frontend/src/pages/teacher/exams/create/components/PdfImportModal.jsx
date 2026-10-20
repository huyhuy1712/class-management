import { useState } from 'react'
import FrogLoading from '../../../../../utils/FrogLoading'
import { Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import usePdfExamImport from '../hooks/usePdfExamImport'
import { pdfImportSections, validatePdfImport } from '../helpers/pdfImportAdapter'
import { loadExamDraft, saveExamDraft } from '../../draft/examDraftStorage'

export default function PdfImportModal({ open, onClose, config }) {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [examNumber, setExamNumber] = useState('1')
  const [error, setError] = useState('')
  const {
    query,
    upload,
    uploading,
    uploadError,
    reset,
    cancel,
    cancelling,
    cancelError,
  } = usePdfExamImport()
  const job = query.data
  const busy = uploading || ['QUEUED', 'PROCESSING'].includes(job?.status)

  const begin = async () => {
    const invalid = validatePdfImport(file, examNumber)
    setError(invalid)
    if (invalid) return

    try {
      await upload({ file, examNumber })
    } catch {
      /* Error is displayed from mutation. */
    }
  }

  const edit = () => {
    try {
      const sections = pdfImportSections(job.preview)
      const hasExistingDraft = loadExamDraft()?.builder?.sections?.length

      if (
        hasExistingDraft &&
        !window.confirm(
          'Nội dung bản nháp hiện tại sẽ được thay bằng đề vừa import. Tiếp tục?'
        )
      ) {
        return
      }

      const saved = saveExamDraft({
        builder: { sections },
        draftToken: job.draftToken,
        pdfImport: {
          importId: job.importId,
          sourceReviewed: false,
          illustrationAssetIds: [],
        },
        pendingSave: null,
      })

      if (!saved) {
        throw new Error('Không thể lưu bản nháp trên trình duyệt.')
      }

      navigate('/teacher/exams/create/online', {
        state: { examConfig: config },
      })
    } catch (cause) {
      setError(cause.message)
    }
  }

  return (
    <Modal
      title="Nhập một đề từ file PDF"
      open={open}
      onCancel={onClose}
      maskClosable={!busy}
      footer={null}
    >
      <div className="space-y-4 pt-3 text-sm">
        <p className="text-slate-500">
          Chọn file và xác định đề bạn muốn lấy trong file. Mỗi lần chỉ import
          một đề. Hệ thống chưa tự lưu thành đề thi.
        </p>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Khi bắt đầu import mới, các tác vụ import trước chưa lưu của bạn sẽ tự
          hủy, kể cả preview đã sẵn sàng hoặc tác vụ đang xử lý. Đề đã lưu không
          bị ảnh hưởng.
        </p>

        <label className="block font-semibold">
          File PDF (tối đa 10 MiB)
          <input
            disabled={busy || Boolean(job)}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setError('')
            }}
            className="mt-2 block w-full rounded-lg border p-3"
          />
        </label>

        <label className="block font-semibold">
          Bạn muốn import đề nào?
          <input
            disabled={busy || Boolean(job)}
            type="number"
            min="1"
            step="1"
            value={examNumber}
            onChange={(event) => setExamNumber(event.target.value)}
            className="mt-2 block w-full rounded-lg border p-3"
          />
        </label>

        <p className="text-xs text-slate-500">
          Nhập 2 để chọn Đề 2 trong file. Đây là số thứ tự của đề, không phải số
          lượng đề cần import.
        </p>

        {(error || uploadError || cancelError || query.isError) && (
          <p role="alert" className="text-red-600">
            {error ||
              cancelError?.response?.data?.message ||
              cancelError?.message ||
              uploadError?.response?.data?.message ||
              uploadError?.message ||
              query.errorMessage}
            {query.isError && (
              <button
                onClick={() => query.refetch()}
                className="ml-2 underline"
              >
                Tải lại trạng thái
              </button>
            )}
          </p>
        )}

        {job && (
          <div role="status" className="rounded-xl bg-emerald-50 p-4">
            {busy && (
              <FrogLoading
                compact
                label={`Đang xử lý Đề ${job.examNumber}...`}
                className="mb-2"
              />
            )}
            <p>
              Đề số {job.examNumber} ·{' '}
              {job.status === 'READY_FOR_REVIEW'
                ? 'Đã phân tích, sẵn sàng kiểm tra'
                : job.status === 'FAILED'
                  ? 'Import thất bại'
                  : job.status === 'EXPIRED'
                    ? 'Tác vụ đã hết hạn'
                    : job.status === 'CANCELLED'
                      ? 'Đã hủy tác vụ'
                      : 'Đang xử lý'}
            </p>
            <p className="mt-1 text-xs text-slate-500">{job.stage}</p>
            {job.errorMessage && (
              <p className="mt-2 text-red-600">{job.errorMessage}</p>
            )}
            {job.status === 'READY_FOR_REVIEW' && (
              <p className="mt-2">
                {job.preview?.counts?.sections} phần ·{' '}
                {job.preview?.counts?.questions} câu. Hãy kiểm tra đáp án, ảnh,
                công thức và nhập điểm trước khi lưu.
              </p>
            )}
          </div>
        )}

        {!job && (
          <button
            disabled={uploading}
            onClick={begin}
            className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {uploading
              ? 'Đang gửi file...'
              : uploadError
                ? 'Thử gửi lại cùng tác vụ'
                : 'Bắt đầu import'}
          </button>
        )}

        {job?.status === 'READY_FOR_REVIEW' && (
          <button
            onClick={edit}
            className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
          >
            Mở trình chỉnh sửa và đối chiếu
          </button>
        )}

        {['QUEUED', 'PROCESSING', 'READY_FOR_REVIEW', 'FAILED'].includes(job?.status) &&
          !job?.createdExam && (
          <button
            disabled={cancelling}
            onClick={() => {
              if (
                job.status === 'READY_FOR_REVIEW' &&
                !window.confirm('Bỏ preview này và giải phóng quota import?')
              ) {
                return
              }
              cancel().catch(() => {})
            }}
            className="ml-3 rounded-xl border border-red-200 px-4 py-3 text-red-700 disabled:opacity-50"
          >
            {cancelling
              ? 'Đang hủy...'
              : ['QUEUED', 'PROCESSING'].includes(job.status)
                ? 'Hủy tác vụ'
                : 'Bỏ job, giải phóng quota'}
          </button>
        )}

        {job && !busy && !cancelling && (
          <button
            onClick={() => {
              reset()
              setError('')
            }}
            className="ml-3 rounded-xl border px-4 py-3"
          >
            Chọn file hoặc đề khác
          </button>
        )}

        <p className="text-xs text-slate-400">
          Đóng cửa sổ không hủy xử lý trên máy chủ.
        </p>
      </div>
    </Modal>
  )
}
