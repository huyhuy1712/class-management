import { useState } from 'react'
import { Download, ExternalLink, FileText, Pencil, Trash2 } from 'lucide-react'
import materialService from '../../../services/materialService'
import {
  getMaterialDownloadName,
  getMaterialDownloadUrl,
} from '../../../pages/teacher/materials/helpers/materialDownload'

function getSafeDocumentUrl(fileUrl) {
  if (!fileUrl) return null

  try {
    const url = new URL(fileUrl, window.location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function triggerDownload(file, fileName) {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ClassMaterialList({
  documents,
  canDownload = false,
  canEdit,
  canRemove,
  onEdit,
  onRemove,
}) {
  const [downloadingId, setDownloadingId] = useState(null)
  const [downloadError, setDownloadError] = useState('')

  const handleDownload = async (document) => {
    const fileName = getMaterialDownloadName(
      document.title,
      document.fileName ?? document.file?.name,
    )
    const downloadUrl = getMaterialDownloadUrl(document.fileUrl, fileName)
    if (!document.file && !downloadUrl) {
      setDownloadError('Không tìm thấy đường dẫn tải tài liệu.')
      return
    }

    try {
      setDownloadingId(document.id)
      setDownloadError('')
      const file = document.file ?? await materialService.getFile(downloadUrl)
      triggerDownload(file, fileName)
    } catch (error) {
      setDownloadError(
        error.response?.data?.message || error.message || `Không thể tải “${document.title}”.`,
      )
    } finally {
      setDownloadingId(null)
    }
  }

  if (!documents.length) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <FileText size={23} />
        </span>
        <p className="font-semibold text-slate-700">Chưa có tài liệu</p>
        <p className="mt-1 text-sm text-slate-500">Tài liệu được chia sẻ với lớp sẽ xuất hiện ở đây.</p>
      </div>
    )
  }

  return (
    <>
    {downloadError && (
      <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {downloadError}
      </p>
    )}
    <ul className="space-y-3">
      {documents.map((document) => {
        const fileUrl = getSafeDocumentUrl(document.fileUrl)

        return (
          <li key={document.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FileText size={20} />
              </span>
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-[#18301D]">{document.title}</h3>
                {document.fileName && <p className="mt-1 break-all text-sm text-slate-400">{document.fileName}</p>}
                {document.content && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">{document.content}</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:pl-4">
              {canDownload && (fileUrl || document.file) && (
                <button
                  type="button"
                  disabled={downloadingId === document.id}
                  onClick={() => handleDownload(document)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60 sm:flex-none"
                >
                  <Download size={16} />
                  {downloadingId === document.id ? 'Đang tải...' : 'Tải tài liệu'}
                </button>
              )}
              {!canDownload && fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:flex-none"
                >
                  Mở tài liệu <ExternalLink size={16} />
                </a>
              )}
              {!canDownload && !fileUrl && document.file && (
                <button
                  type="button"
                  onClick={() => handleDownload(document)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:flex-none"
                >
                  Tải tài liệu <Download size={15} />
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Sửa ${document.title}`}
                  title="Sửa tài liệu"
                  onClick={() => onEdit(document)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Pencil size={17} />
                </button>
              )}
              {canRemove && (
                <button
                  type="button"
                  aria-label={`Gỡ ${document.title} khỏi lớp`}
                  title="Gỡ khỏi lớp"
                  onClick={() => onRemove(document)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
    </>
  )
}
