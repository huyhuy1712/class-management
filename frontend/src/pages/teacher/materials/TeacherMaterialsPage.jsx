import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, Plus, Search, X } from 'lucide-react'
import DashboardLayout from '../../../layouts/DashboardLayout'
import useTeacherMaterials from './hooks/useTeacherMaterials'
import useMaterialTargetOptions from './hooks/useMaterialTargetOptions'
import MaterialEditorModal from './components/MaterialEditorModal'
import MaterialList from './components/MaterialList'

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Không thể thực hiện thao tác. Vui lòng thử lại.'
}

export default function TeacherMaterialsPage() {
  const [search, setSearch] = useState('')
  const [editorMaterial, setEditorMaterial] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [actionError, setActionError] = useState('')
  const [toast, setToast] = useState('')
  const targets = useMaterialTargetOptions()
  const manager = useTeacherMaterials()
  const classes = targets.classes
  const students = targets.students

  const filteredMaterials = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase()
    if (!keyword) return manager.materials
    return manager.materials.filter((item) =>
      `${item.title} ${item.content ?? ''} ${item.fileName ?? ''}`.toLocaleLowerCase().includes(keyword),
    )
  }, [manager.materials, search])

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const saveMaterial = async (material) => {
    setActionError('')
    try {
      await manager.save(material)
      setEditorOpen(false)
      if (material.id) setToast('Cập nhật tài liệu thành công.')
      return { success: true }
    } catch (error) {
      const message = getErrorMessage(error)
      setActionError(message)
      return { success: false, message }
    }
  }

  const deleteMaterial = async () => {
    if (!deleteCandidate) return
    try {
      setActionError('')
      await manager.remove(deleteCandidate.id)
      setToast('Xóa tài liệu thành công.')
      setDeleteCandidate(null)
    } catch (error) {
      setActionError(getErrorMessage(error))
    }
  }

  const openCreate = () => {
    setEditorMaterial(null)
    setEditorOpen(true)
  }

  return (
    <DashboardLayout>
      {toast && (
        <div
          role="status"
          className="fixed right-4 top-4 z-[120] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-lg sm:right-6 sm:top-6"
        >
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{toast}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast('')} className="-mr-1 -mt-1 rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}
      <div className="mx-auto max-w-[1440px] px-1 pb-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700"><BookOpen size={15} /> Kho tài liệu</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#18301D] sm:text-3xl">Tài liệu</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Quản lý tệp học tập và phân phối đến toàn bộ học sinh, từng lớp hoặc từng học sinh.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            <Plus size={18} /> Đăng tài liệu
          </button>
        </header>

        {(manager.error || targets.error || actionError) && (
          <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {actionError || manager.error || targets.error}
            {targets.error && <button type="button" onClick={targets.retry} className="ml-2 font-semibold underline">Thử tải lại</button>}
          </p>
        )}

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="relative block w-full sm:max-w-lg">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên tài liệu hoặc tên tệp..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50" />
          </label>
        </section>

        {manager.loading || targets.loading ? (
          <div role="status" className="rounded-2xl border border-slate-200 bg-white py-14 text-center text-sm text-slate-500">Đang tải tài liệu và danh sách phân phối...</div>
        ) : (
          <MaterialList
            materials={filteredMaterials}
            classes={classes}
            students={students}
            onEdit={(material) => { setEditorMaterial(material); setEditorOpen(true) }}
            onDelete={setDeleteCandidate}
          />
        )}

        {editorOpen && (
          <MaterialEditorModal
            material={editorMaterial}
            classes={classes}
            students={students}
            targetError={targets.error}
            retryTargets={targets.retry}
            saving={manager.pending}
            onClose={() => setEditorOpen(false)}
            onSave={saveMaterial}
          />
        )}

        {deleteCandidate && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && setDeleteCandidate(null)}>
            <section role="alertdialog" aria-modal="true" aria-labelledby="delete-material-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h2 id="delete-material-title" className="text-lg font-bold text-slate-900">Xóa tài liệu?</h2>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">“{deleteCandidate.title}” và tệp đã tải lên sẽ bị xóa vĩnh viễn.</p>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteCandidate(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Hủy</button>
                <button type="button" onClick={deleteMaterial} disabled={manager.pending} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{manager.pending ? 'Đang xóa...' : 'Xóa tài liệu'}</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
