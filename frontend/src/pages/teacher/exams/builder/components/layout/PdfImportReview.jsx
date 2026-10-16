import { useEffect, useRef, useState } from 'react'
import useResourceQuery from '../../../../../../query/useResourceQuery'
import { loadExamDraft, saveExamDraft } from '../../../draft/examDraftStorage'

function SourceImage({ importId, asset }) {
  const query = useResourceQuery('pdfExamImportAsset', [importId, asset.id])
  const image = useRef(null)
  const link = useRef(null)

  useEffect(() => {
    if (!query.data) return

    const value = URL.createObjectURL(query.data)
    if (image.current) image.current.src = value
    if (link.current) link.current.href = value

    return () => URL.revokeObjectURL(value)
  }, [query.data])

  return (
    <>
      {query.data && (
        <a ref={link} target="_blank" rel="noreferrer">
          <img
            ref={image}
            alt={`Nguồn PDF ${asset.ownerId}`}
            className="max-h-80 w-full object-contain"
          />
        </a>
      )}
      {!query.data && (
        <p>
          {query.isError ? 'Không tải được ảnh.' : 'Đang tải ảnh...'}
          <button onClick={() => query.refetch()} className="ml-2 underline">
            Tải lại
          </button>
        </p>
      )}
    </>
  )
}

export default function PdfImportReview({ importId }) {
  const query = useResourceQuery('pdfExamImport', [importId], { staleTime: 0 })
  const [review, setReview] = useState(() => loadExamDraft()?.pdfImport ?? {})
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [assetLimit, setAssetLimit] = useState(12)

  const change = (patch) => {
    const next = { ...review, ...patch }
    if (!saveExamDraft({ pdfImport: next })) {
      setError('Không thể lưu xác nhận trên trình duyệt.')
      return
    }

    setReview(next)
    setError('')
  }

  const preview = query.data?.preview
  const issues = [
    ...(preview?.structure?.issues ?? []),
    ...(preview?.latex?.issues ?? []),
  ]

  return (
    <section className="mb-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
      <h2 className="font-bold text-amber-900">Kiểm tra đề nhập từ PDF</h2>
      <p>
        Hãy tự nhập điểm, đối chiếu và sửa toàn bộ nội dung, đáp án và công thức.
        Ảnh nguồn không tự gắn vào đề; chỉ ảnh minh họa được chọn mới gắn khi lưu.
      </p>

      {query.isLoading && <p role="status">Đang tải nguồn đối chiếu...</p>}

      {(error || query.isError) && (
        <p role="alert" className="text-red-600">
          {error || query.errorMessage}
          <button onClick={() => query.refetch()} className="ml-2 underline">
            Tải lại
          </button>
        </p>
      )}

      {query.data && query.data.status !== 'READY_FOR_REVIEW' && (
        <p className="text-red-600">
          Tác vụ không còn sẵn sàng: {query.data.status}.{' '}
          {query.data.errorMessage}
        </p>
      )}

      {preview && (
        <details onToggle={(event) => setExpanded(event.currentTarget.open)}>
          <summary className="cursor-pointer font-semibold">
            Nguồn đối chiếu, công thức và cảnh báo ({issues.length})
          </summary>
          {expanded && (
            <div className="mt-3 space-y-4">
              <ul className="max-h-48 space-y-1 overflow-auto">
                {issues.map((issue, index) => (
                  <li key={index}>
                    {issue.path} · {issue.message}
                  </li>
                ))}
              </ul>

              {preview.latex?.formulas?.map((formula) => (
                <p
                  key={formula.id}
                  className="break-all rounded bg-white p-2 font-mono text-xs"
                >
                  {formula.ownerId}:{' '}
                  {formula.recognizedLatex || 'Chưa nhận dạng được'} ·{' '}
                  {formula.syntaxStatus} / {formula.renderStatus}
                </p>
              ))}

              <div className="grid gap-4 lg:grid-cols-2">
                {preview.media?.slice(0, assetLimit).map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-xl border bg-white p-3"
                  >
                    <p className="mb-2 text-xs">
                      {asset.owner} · {asset.ownerId} ·{' '}
                      {asset.purpose === 'ILLUSTRATION'
                        ? 'Ảnh minh họa'
                        : 'Nguồn đối chiếu riêng tư'}
                    </p>
                    <SourceImage importId={importId} asset={asset} />
                    {asset.purpose === 'ILLUSTRATION' && (
                      <label className="mt-3 flex gap-2">
                        <input
                          type="checkbox"
                          checked={
                            review.illustrationAssetIds?.includes(asset.id) ??
                            false
                          }
                          onChange={(event) =>
                            change({
                              sourceReviewed: false,
                              illustrationAssetIds: event.target.checked
                                ? [
                                    ...(review.illustrationAssetIds ?? []),
                                    asset.id,
                                  ]
                                : review.illustrationAssetIds.filter(
                                    (id) => id !== asset.id
                                  ),
                            })
                          }
                        />
                        Gắn ảnh này vào câu/phương án gốc khi lưu
                      </label>
                    )}
                  </div>
                ))}
              </div>

              {preview.media?.length > assetLimit && (
                <button
                  onClick={() => setAssetLimit((count) => count + 12)}
                  className="underline"
                >
                  Xem thêm vùng nguồn
                </button>
              )}
            </div>
          )}
        </details>
      )}

      <label className="flex items-start gap-2 font-semibold">
        <input
          type="checkbox"
          className="mt-1"
          disabled={query.data?.status !== 'READY_FOR_REVIEW'}
          checked={review.sourceReviewed ?? false}
          onChange={(event) => change({ sourceReviewed: event.target.checked })}
        />
        Tôi đã đối chiếu đầy đủ nội dung, đáp án, ảnh và công thức với PDF nguồn
        và sửa các chỗ nhận dạng sai.
      </label>
    </section>
  )
}
