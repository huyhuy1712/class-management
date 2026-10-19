import { BookOpen, ExternalLink, FileText } from 'lucide-react'
import { useParams } from 'react-router-dom'
import FrogLoading from '../../../utils/FrogLoading'
import useResourceQuery from '../../../query/useResourceQuery'

function getSafeDocumentUrl(fileUrl) {
  if (!fileUrl) return null

  try {
    const url = new URL(fileUrl, window.location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export default function ClassDocumentsTab({ classId: providedClassId } = {}) {
  const { classId: routeClassId } = useParams()
  const classId = providedClassId ?? routeClassId
  const query = useResourceQuery('classDocuments', [classId])
  const documents = query.data ?? []

  return (
    <div>
      <h2 className="flex items-center gap-3 text-xl font-bold text-[#18301D]">
        <BookOpen size={23} className="text-emerald-600" />
        Tài liệu
      </h2>
      {query.isError && query.data && (
        <p role="alert" className="mt-4 text-sm text-amber-700">
          Chưa cập nhật được tài liệu mới. <button type="button" onClick={() => query.refetch()} className="underline">Thử lại</button>
        </p>
      )}
      {query.isLoading ? (
        <FrogLoading label="Đang tải tài liệu..." className="py-10 text-center text-slate-500" />
      ) : query.errorMessage ? (
        <p role="alert" className="py-8 text-red-600">
          {query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button>
        </p>
      ) : documents.length ? (
        <ul className="mt-5 divide-y divide-slate-100">
          {documents.map((document) => {
            const fileUrl = getSafeDocumentUrl(document.fileUrl)

            return (
              <li key={document.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FileText size={20} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-[#18301D]">{document.title}</h3>
                    {document.content && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-500">{document.content}</p>}
                  </div>
                </div>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Mở tài liệu <ExternalLink size={15} />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-slate-500">Lớp chưa có tài liệu.</p>
      )}
    </div>
  )
}
