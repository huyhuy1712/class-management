import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Download, EllipsisVertical, FileText, Headphones, Pencil, Trash2 } from 'lucide-react'
import defaultAvatar from '../../../../assets/images/avatar_default.png'
import useAuthStore from '../../../../stores/authStore'
import materialService from '../../../../services/materialService'
import MaterialPreview from './MaterialPreview'
import { getMaterialDownloadName, getMaterialDownloadUrl, getMaterialPreviewUrl } from '../helpers/materialDownload'

function formatFileSize(size) {
  if (!size) return 'Tài liệu'
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`
}

function getExtension(fileName = '') {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function previewMaterialFile(material, onPreview) {
  if (getExtension(material.file?.name ?? material.fileName) !== 'pdf') {
    onPreview(material)
    return
  }

  const url = material.file
    ? URL.createObjectURL(material.file)
    : getMaterialPreviewUrl(material.fileUrl)
  if (!url) {
    onPreview(material)
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
  if (material.file) window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000)
}

function getFileKind(material) {
  const extension = getExtension(material.fileName)
  if (['doc', 'docx', 'odt'].includes(extension)) return { label: 'Word', icon: 'W', color: 'bg-blue-600' }
  if (['ppt', 'pptx', 'odp'].includes(extension)) return { label: 'PowerPoint', icon: 'P', color: 'bg-orange-600' }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) return { label: 'Excel', icon: 'X', color: 'bg-green-700' }
  if (extension === 'pdf') return { label: 'PDF', icon: 'PDF', color: 'bg-red-600' }
  if (['mp3', 'wav', 'm4a', 'ogg'].includes(extension)) return { label: 'Âm thanh', Icon: Headphones, color: 'bg-red-500' }
  return { label: extension ? extension.toUpperCase() : 'Tệp', icon: '•', color: 'bg-slate-600' }
}

function getRecipients(material, classes, students) {
  if (material.targetType === 'ALL') return ['Tất cả học sinh']
  if (material.targetType === 'CLASS') {
    return classes
      .filter((classroom) => material.classIds?.some((id) => String(id) === String(classroom.id)))
      .map((classroom) => classroom.name)
  }
  return students
    .filter((student) => material.studentIds?.some((id) => String(id) === String(student.id)))
    .map((student) => student.fullName)
}

async function downloadMaterial(material) {
  const fileName = getMaterialDownloadName(material.title, material.file?.name ?? material.fileName)
  const fileUrl = getMaterialDownloadUrl(material.fileUrl, fileName)
  if (!material.file && !fileUrl) throw new Error('URL tài liệu không hợp lệ')
  const blob = material.file ?? await materialService.getFile(fileUrl)
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

function FileTypeIcon({ kind }) {
  const Icon = kind.Icon
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-extrabold text-white ${kind.color}`}>
      {Icon ? <Icon size={13} /> : kind.icon}
    </span>
  )
}

function FileCard({ material, classes, students, owner, onEdit, onDelete, onPreview }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const kind = getFileKind(material)
  const recipients = getRecipients(material, classes, students)
  const ownerName = material.ownerName ?? owner.fullName ?? owner.username ?? 'Tôi'
  const ownerAvatar = material.ownerAvatar ?? owner.avatar
  const handleDownload = async () => {
    setMenuOpen(false)
    setDownloadError('')
    try {
      await downloadMaterial(material)
    } catch {
      setDownloadError('Không thể tải tài liệu. Vui lòng thử lại.')
    }
  }
  return (
    <article className="group relative w-full max-w-[300px] rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex h-12 items-center gap-2 px-2">
        <FileTypeIcon kind={kind} />
        <button
          type="button"
          title={material.fileName || material.title}
          onClick={() => previewMaterialFile(material, onPreview)}
          className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-slate-800 hover:text-emerald-700"
        >
          {material.fileName || material.title}
        </button>
        <div className="relative">
          <button
            type="button"
            aria-label={`Thao tác với ${material.title}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            <EllipsisVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <button type="button" aria-label="Đóng menu thao tác" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                <button type="button" onClick={handleDownload} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><Download size={15} /> Tải xuống</button>
                <button type="button" onClick={() => { setMenuOpen(false); onEdit(material) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><Pencil size={15} /> Chỉnh sửa</button>
                <button type="button" onClick={() => { setMenuOpen(false); onDelete(material) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"><Trash2 size={15} /> Xóa tài liệu</button>
              </div>
            </>
          )}
        </div>
      </div>

      {downloadError && <p role="alert" className="px-2 pb-2 text-xs text-red-600">{downloadError}</p>}

      <button
        type="button"
        onClick={() => previewMaterialFile(material, onPreview)}
        aria-label={`Xem trước ${material.title}`}
        className="block h-[208px] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100 p-2 text-left"
      >
        <MaterialPreview material={material} mode="card" />
      </button>

      <div className="flex min-h-12 items-center gap-2 px-2 pt-2">
        <img
          src={ownerAvatar || defaultAvatar}
          alt=""
          onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultAvatar }}
          className="h-7 w-7 rounded-full border border-slate-100 object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-700">{ownerName}</p>
          <p className="truncate text-[11px] text-slate-400">
            {recipients.join(', ') || 'Chưa phân phối'} · {formatFileSize(material.fileSize)}
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-slate-400">{kind.label}</span>
      </div>
    </article>
  )
}

function FilterSelect({ label, value, onChange, children, className = '' }) {
  return (
    <label className={`relative inline-flex ${className}`}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
        {children}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">▾</span>
    </label>
  )
}

export default function MaterialList({ materials, classes, students, onEdit, onDelete }) {
  const owner = useAuthStore((state) => state.user) ?? {}
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [sortDirection, setSortDirection] = useState('asc')
  const [previewMaterial, setPreviewMaterial] = useState(null)

  const fileTypes = useMemo(() => [...new Set(materials.map((item) => getFileKind(item).label))].sort(), [materials])
  const filteredMaterials = useMemo(() => {
    const result = materials.filter((material) => {
      const typeMatches = typeFilter === 'all' || getFileKind(material).label === typeFilter
      return typeMatches
    })
    const direction = sortDirection === 'asc' ? 1 : -1
    result.sort((left, right) => {
      if (sortBy === 'name') return left.title.localeCompare(right.title, 'vi') * direction
      return (new Date(right.updatedAt ?? right.createdAt) - new Date(left.updatedAt ?? left.createdAt)) * direction
    })
    return result
  }, [materials, sortBy, sortDirection, typeFilter])

  if (!materials.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><FileText size={25} /></div>
        <h2 className="mt-4 font-semibold text-slate-800">Chưa có tài liệu</h2>
        <p className="mt-1 text-sm text-slate-500">Đăng tài liệu để bắt đầu xây dựng kho tệp của bạn.</p>
      </div>
    )
  }

  return (
    <>
      <section aria-label="Bộ lọc và sắp xếp tài liệu" className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <FilterSelect label="Lọc theo loại tệp" value={typeFilter} onChange={setTypeFilter}>
            <option value="all">Loại</option>
            {fileTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </FilterSelect>
          <FilterSelect label="Sắp xếp tài liệu" value={sortBy} onChange={setSortBy}>
            <option value="recent">Lần sửa đổi gần đây nhất</option>
            <option value="name">Tên</option>
          </FilterSelect>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <span>{sortBy === 'name' ? 'Tên' : 'Lần sửa đổi gần đây nhất'}</span>
          <button
            type="button"
            aria-label={sortDirection === 'asc' ? 'Đổi thứ tự sắp xếp' : 'Đổi thứ tự sắp xếp'}
            onClick={() => setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')}
            className="rounded-full bg-sky-100 p-1 text-sky-800 hover:bg-sky-200"
          >
            {sortDirection === 'asc' ? <ArrowDown size={15} /> : <ArrowUp size={15} />}
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {filteredMaterials.length} / {materials.length} tệp
          </span>
        </div>
      </section>

      {filteredMaterials.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(245px,300px))] justify-start gap-5">
          {filteredMaterials.map((material) => (
            <FileCard
              key={`${material.id}:${material.fileName}`}
              material={material}
              classes={classes}
              students={students}
              owner={owner}
              onEdit={onEdit}
              onDelete={onDelete}
              onPreview={setPreviewMaterial}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <h2 className="font-semibold text-slate-800">Không tìm thấy tài liệu phù hợp</h2>
          <p className="mt-1 text-sm text-slate-500">Thử thay đổi bộ lọc để xem thêm tệp.</p>
        </div>
      )}

      {previewMaterial && (
        <MaterialPreview
          key={`${previewMaterial.id}:${previewMaterial.fileName}`}
          material={previewMaterial}
          mode="modal"
          onClose={() => setPreviewMaterial(null)}
        />
      )}
    </>
  )
}
