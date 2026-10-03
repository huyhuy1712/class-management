import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'
import classroomService from '../../../../../../services/classroomService'

function getErrorMessage(data) {
  if (!data) return ''
  if (typeof data === 'string') return data

  return data.message || data.error || ''
}

function validateImportFile(file) {
  if (!file) {
    return 'Vui lòng chọn file Excel.'
  }

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return 'File không hợp lệ. Chỉ hỗ trợ file Excel định dạng .xlsx.'
  }

  if (file.size === 0) {
    return 'File Excel đang trống. Vui lòng chọn file khác.'
  }

  if (file.size > 5 * 1024 * 1024) {
    return 'File quá lớn. Vui lòng chọn file có dung lượng không quá 5 MB.'
  }

  return ''
}

function ImportStudentsModal({ classroomId, onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  const resetForm = () => {
    setFile(null)
    setError('')
    setResult(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const closeModal = () => {
    if (importing) return
    onClose()
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]
    setError('')
    setResult(null)

    if (!selectedFile) {
      setFile(null)
      return
    }

    const validationError = validateImportFile(selectedFile)
    if (validationError) {
      setFile(null)
      setError(validationError)
      event.target.value = ''
      return
    }

    setFile(selectedFile)
  }

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true)
      setError('')

      const template =
        await classroomService.downloadStudentImportTemplate()
      const downloadUrl = URL.createObjectURL(template)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'mau-import-hoc-sinh.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
    } catch (downloadError) {
      console.error('Download student import template error:', downloadError)
      setError('Không thể tải file mẫu. Vui lòng thử lại.')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleImport = async () => {
    if (importing) return

    const validationError = validateImportFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!classroomId) {
      setError('Không xác định được lớp học.')
      return
    }

    try {
      setImporting(true)
      setError('')
      setResult(null)

      const importResult = await classroomService.importStudents(
        classroomId,
        file,
      )
      setResult(importResult)

      if (importResult?.success > 0) {
        await onImported()
      }
    } catch (importError) {
      console.error('Import students error:', importError)

      const status = importError.response?.status
      const backendMessage = getErrorMessage(
        importError.response?.data,
      )

      if (status === 400) {
        setError(
          backendMessage ||
            'File Excel không hợp lệ. Vui lòng kiểm tra định dạng file, sheet đầu tiên và tiêu đề "Mã học sinh".',
        )
      } else if (status === 401) {
        setError(
          'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
        )
      } else {
        setError(
          backendMessage ||
            'Không thể import học sinh. Vui lòng thử lại.',
        )
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <FileSpreadsheet size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#18301D]">
                Import học sinh từ Excel
              </h2>
              <p className="mt-0.5 text-sm text-gray-400">
                Thêm nhiều học sinh vào lớp cùng lúc
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={importing}
            onClick={closeModal}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {!result && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  disabled={downloadingTemplate || importing}
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingTemplate ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {downloadingTemplate ? 'Đang tải...' : 'Tải file mẫu Excel'}
                </button>
              </div>

              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition ${
                  file
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-gray-200 bg-gray-50/50 hover:border-green-300 hover:bg-green-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  disabled={importing}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <FileSpreadsheet size={26} />
                    </div>
                    <p className="mt-4 max-w-full truncate font-semibold text-[#18301D]">
                      {file.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <p className="mt-3 text-sm font-medium text-green-600">
                      Nhấn để chọn file khác
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Upload size={25} />
                    </div>
                    <p className="mt-4 font-semibold text-[#18301D]">
                      Chọn file Excel
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Nhấn vào đây để chọn file .xlsx
                    </p>
                    <span className="mt-4 rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700">
                      Chọn file
                    </span>
                  </>
                )}
              </label>
            </>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-500"
              />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Không thể import học sinh
                </p>
                <p className="mt-1 text-sm leading-5 text-red-600">
                  {error}
                </p>
              </div>
            </div>
          )}

          {result && (
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#18301D]">
                    Import hoàn tất
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-400">
                    File Excel đã được xử lý.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-[#18301D]">
                    {result.total ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">Tổng</p>
                </div>
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {result.success ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-green-600">
                    Thành công
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {result.failed ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-red-500">
                    Thất bại
                  </p>
                </div>
              </div>

              {Array.isArray(result.errors) &&
                result.errors.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-3 flex items-center gap-2">
                      <AlertCircle size={17} className="text-red-500" />
                      <p className="text-sm font-semibold text-[#18301D]">
                        Các dòng không thể thêm
                      </p>
                    </div>
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {result.errors.map((item, index) => (
                        <div
                          key={`${item.row}-${item.studentCode}-${index}`}
                          className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-600">
                              Dòng {item.row}
                            </span>
                            {item.studentCode && (
                              <span className="text-sm font-semibold text-[#18301D]">
                                {item.studentCode}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-5 text-red-600">
                            {item.message || 'Không thể thêm học sinh.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {(result.failed ?? 0) === 0 && (
                <div className="mt-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Tất cả học sinh trong file đã được thêm vào lớp thành công.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          {result ? (
            <>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Import file khác
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Hoàn tất
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={importing}
                onClick={closeModal}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={importing || !file}
                onClick={handleImport}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Đang import...
                  </>
                ) : (
                  <>
                    <Upload size={17} />
                    Import học sinh
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportStudentsModal
