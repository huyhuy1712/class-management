import { useEffect, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Headphones, Presentation, X } from 'lucide-react'
import materialService from '../../../../services/materialService'
import { getMaterialDownloadName, getMaterialDownloadUrl } from '../helpers/materialDownload'

function getExtension(fileName = '') {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function getKind(fileName) {
  const extension = getExtension(fileName)
  if (['doc', 'docx', 'odt'].includes(extension)) return { name: 'Word', short: 'W', color: 'bg-blue-600', Icon: FileText }
  if (['ppt', 'pptx', 'odp'].includes(extension)) return { name: 'PowerPoint', short: 'P', color: 'bg-orange-600', Icon: Presentation }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) return { name: 'Excel', short: 'X', color: 'bg-green-700', Icon: FileSpreadsheet }
  if (extension === 'pdf') return { name: 'PDF', short: 'PDF', color: 'bg-red-600', Icon: FileText }
  if (['mp3', 'wav', 'm4a', 'ogg'].includes(extension)) return { name: 'Âm thanh', short: '', color: 'bg-red-500', Icon: Headphones }
  return { name: extension.toUpperCase() || 'Tệp', short: extension.toUpperCase() || '•', color: 'bg-slate-600', Icon: FileText }
}

function getSafeUrl(fileUrl) {
  if (!fileUrl) return ''
  try {
    const url = new URL(fileUrl, window.location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

function DocumentSheet({ kind, title }) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-slate-100 p-3">
      <div className="h-full w-[78%] max-w-[290px] overflow-hidden rounded-sm bg-white px-5 py-5 shadow-md">
        <div className="mx-auto h-1.5 w-2/3 rounded bg-slate-300" />
        <div className="mx-auto mt-2 h-1 w-1/2 rounded bg-slate-200" />
        <div className="mt-6 flex items-center justify-center">
          <span className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-extrabold text-white ${kind.color}`}>{kind.short}</span>
        </div>
        <div className="mx-auto mt-4 max-w-[90%] truncate text-center text-[10px] font-semibold text-slate-600">{title}</div>
        <div className="mt-5 space-y-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex gap-2">
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className={`h-1 rounded bg-slate-200 ${index % 2 ? 'w-4/5' : 'w-full'}`} />
            </div>
          ))}
        </div>
        {kind.name === 'Excel' && (
          <div className="mt-4 grid grid-cols-3 gap-px bg-slate-300">
            {Array.from({ length: 12 }, (_, index) => <span key={index} className={`h-4 ${index < 3 ? 'bg-green-50' : 'bg-white'}`} />)}
          </div>
        )}
        <div className="mt-5 space-y-2">
          <div className="h-1 w-full rounded bg-slate-100" />
          <div className="h-1 w-5/6 rounded bg-slate-100" />
          <div className="h-1 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

export default function MaterialPreview({ material, mode, onClose }) {
  const kind = getKind(material.fileName)
  const extension = getExtension(material.fileName)
  const localFile = material.file
  const remoteUrl = getSafeUrl(material.fileUrl)
  const isPdf = extension === 'pdf'
  const isSpreadsheet = ['xlsx', 'xlsm'].includes(extension)
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)
  const isAudio = ['mp3', 'wav', 'm4a', 'ogg'].includes(extension)
  const needsLocalPreview = localFile && (isImage || mode === 'modal' && (isPdf || isAudio))
  const [objectUrl] = useState(() => needsLocalPreview ? URL.createObjectURL(localFile) : '')
  const [spreadsheet, setSpreadsheet] = useState(null)
  const [spreadsheetError, setSpreadsheetError] = useState('')
  const [spreadsheetLoading, setSpreadsheetLoading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }, [objectUrl])

  useEffect(() => {
    if (mode !== 'modal' || !isSpreadsheet || (!localFile && !material.fileUrl)) return undefined

    let cancelled = false
    const loadSpreadsheet = async () => {
      setSpreadsheetLoading(true)
      setSpreadsheetError('')
      try {
        const blob = localFile ?? await materialService.getFile(material.fileUrl)
        const [{ default: ExcelJS }, buffer] = await Promise.all([
          import('exceljs'),
          blob.arrayBuffer(),
        ])
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)
        const worksheet = workbook.worksheets[0]
        if (!worksheet) throw new Error('Tệp không có trang tính.')
        const rows = []
        worksheet.eachRow({ includeEmpty: true }, (row) => {
          if (rows.length < 100) {
            rows.push(Array.from({ length: Math.min(worksheet.columnCount, 30) }, (_, index) => {
              const value = row.getCell(index + 1).value
              if (value && typeof value === 'object') {
                if ('text' in value) return value.text
                if ('result' in value) return value.result
                if ('richText' in value) return value.richText.map((part) => part.text).join('')
              }
              return value ?? ''
            }))
          }
        })
        if (!cancelled) setSpreadsheet({ name: worksheet.name, rows })
      } catch {
        if (!cancelled) setSpreadsheetError('Không thể đọc nội dung bảng tính. Bạn vẫn có thể tải tệp xuống.')
      } finally {
        if (!cancelled) setSpreadsheetLoading(false)
      }
    }

    loadSpreadsheet()
    return () => { cancelled = true }
  }, [isSpreadsheet, localFile, material.fileUrl, mode])

  const previewUrl = objectUrl || (!localFile ? remoteUrl : '')
  const downloadName = getMaterialDownloadName(material.title, localFile?.name ?? material.fileName)
  const downloadUrl = localFile ? objectUrl : getMaterialDownloadUrl(material.fileUrl, downloadName)
  const handleDownload = async () => {
    setDownloadError('')
    setDownloading(true)
    try {
      if (!localFile && !downloadUrl) throw new Error('URL tài liệu không hợp lệ')
      const blob = localFile ?? await materialService.getFile(downloadUrl)
      const href = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = href
      anchor.download = downloadName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(href), 1000)
    } catch {
      setDownloadError('Không thể tải tài liệu. Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  const frame = (
    <div className={`flex h-full w-full items-center justify-center overflow-hidden bg-slate-100 ${mode === 'card' ? 'rounded-lg' : ''}`}>
      {mode === 'modal' && previewUrl && isPdf ? (
        <iframe title={`Xem trước ${material.title}`} src={previewUrl} className="h-full w-full bg-white" />
      ) : mode === 'modal' && isSpreadsheet ? (
        <div className="h-full w-full overflow-auto bg-white p-3">
          {spreadsheetLoading ? (
            <p role="status" className="p-4 text-center text-sm text-slate-500">Đang tải nội dung bảng tính...</p>
          ) : spreadsheetError ? (
            <p role="alert" className="p-4 text-center text-sm text-amber-700">{spreadsheetError}</p>
          ) : spreadsheet ? (
            <div>
              <p className="mb-3 text-xs font-semibold text-slate-500">{spreadsheet.name} · hiển thị tối đa 100 dòng và 30 cột đầu tiên</p>
              <table className="min-w-full border-collapse text-left text-sm">
                <tbody>
                  {spreadsheet.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => {
                        const Cell = rowIndex === 0 ? 'th' : 'td'
                        return <Cell key={cellIndex} className="max-w-[280px] whitespace-pre-wrap break-words border border-slate-200 px-3 py-2 align-top">{String(cell)}</Cell>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="p-4 text-center text-sm text-slate-500">Không có dữ liệu để hiển thị.</p>}
        </div>
      ) : previewUrl && isImage ? (
        <img src={previewUrl} alt={material.title} className="h-full w-full bg-white object-contain" />
      ) : mode === 'modal' && previewUrl && isAudio ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-white">
          <span className={`flex h-20 w-20 items-center justify-center rounded-2xl text-white shadow-sm ${kind.color}`}><Headphones size={42} /></span>
          <audio controls src={previewUrl} className="w-[85%]" />
        </div>
      ) : (
        <DocumentSheet kind={kind} title={material.title} />
      )}
    </div>
  )

  if (mode === 'card') return frame

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="material-preview-title" className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white ${kind.color}`}>{kind.short}</span>
          <div className="min-w-0 flex-1">
            <h2 id="material-preview-title" className="truncate text-sm font-semibold text-slate-800">{material.title}</h2>
            <p className="truncate text-xs text-slate-500">{material.fileName || kind.name}</p>
          </div>
          {(downloadUrl || localFile) && (
            <button type="button" onClick={handleDownload} disabled={downloading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60">
              <Download size={16} /><span className="hidden sm:inline">Tải xuống</span>
            </button>
          )}
          <button type="button" aria-label="Đóng bản xem trước" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
        </header>
        {downloadError && <p role="alert" className="px-5 pt-3 text-sm text-red-600">{downloadError}</p>}
        {material.content && <p className="border-b border-slate-100 px-5 py-3 text-sm text-slate-600">{material.content}</p>}
        <div className="min-h-0 flex-1 p-3 sm:p-5">{frame}</div>
        {!previewUrl && (
          <p className="px-5 pb-4 text-center text-xs text-slate-500">
            Đây là bản xem trước giao diện. Tệp mẫu chưa có nội dung thật để hiển thị.
          </p>
        )}
      </section>
    </div>
  )
}
