import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useParams } from 'react-router-dom'
import FrogLoading from '../../../utils/FrogLoading'
import useResourceQuery from '../../../query/useResourceQuery'
import useAuthStore from '../../../stores/authStore'
import useTeacherMaterials from '../../../pages/teacher/materials/hooks/useTeacherMaterials'
import ClassMaterialList from './ClassMaterialList'
import RemoveClassMaterialModal from './RemoveClassMaterialModal'
import useMaterialTargetOptions from '../../../pages/teacher/materials/hooks/useMaterialTargetOptions'
import MaterialEditorModal from '../../../pages/teacher/materials/components/MaterialEditorModal'

export default function ClassDocumentsTab({ classId: providedClassId } = {}) {
  const { classId: routeClassId } = useParams()
  const classId = providedClassId ?? routeClassId
  const user = useAuthStore((state) => state.user)
  const isTeacher = user?.role === 'TEACHER'
  const query = useResourceQuery('classDocuments', [classId])
  const materials = useTeacherMaterials({ enabled: false })
  const [editCandidate, setEditCandidate] = useState(null)
  const targets = useMaterialTargetOptions({ enabled: Boolean(editCandidate) })
  const [removeCandidate, setRemoveCandidate] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const documents = query.data ?? []

  const handleRemove = async () => {
    if (!removeCandidate) return
    try {
      setActionError('')
      setActionSuccess('')
      await materials.unassignFromClass({ materialId: removeCandidate.id, classId })
      setRemoveCandidate(null)
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || 'Không thể gỡ tài liệu khỏi lớp.')
    }
  }

  const handleSave = async (material) => {
    try {
      setActionError('')
      setActionSuccess('')
      await materials.save(material)
      setEditCandidate(null)
      setActionSuccess('Tài liệu và phân phối đã được cập nhật.')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Không thể cập nhật tài liệu.'
      setActionError(message)
      return { success: false, message }
    }
  }

  return (
    <section className="min-h-[420px] rounded-2xl border border-emerald-100 bg-slate-50 p-5 shadow-sm sm:p-7">
      <header className="mb-7 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <BookOpen size={22} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-[#18301D]">Tài liệu</h2>
          <p className="mt-0.5 text-sm text-slate-500">Tài liệu được chia sẻ với lớp học</p>
        </div>
      </header>
      {query.isError && query.data && (
        <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Chưa cập nhật được tài liệu mới. <button type="button" onClick={() => query.refetch()} className="underline">Thử lại</button>
        </p>
      )}
      {query.isLoading ? (
        <FrogLoading label="Đang tải tài liệu..." className="py-10 text-center text-slate-500" />
      ) : query.errorMessage ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {query.errorMessage}<button type="button" onClick={() => query.refetch()} className="ml-3 underline">Thử lại</button>
        </p>
      ) : (
        <>
          {actionError && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}
          {actionSuccess && <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{actionSuccess}</p>}
          <ClassMaterialList
            documents={documents}
            canDownload={!isTeacher}
            canEdit={isTeacher}
            canRemove={isTeacher}
            onEdit={(document) => {
              setActionError('')
              setActionSuccess('')
              setEditCandidate(document)
            }}
            onRemove={setRemoveCandidate}
          />
        </>
      )}
      {editCandidate && (
        <MaterialEditorModal
          material={editCandidate}
          classes={targets.classes}
          students={targets.students}
          targetError={targets.error}
          targetLoading={targets.loading}
          retryTargets={targets.retry}
          saving={materials.pending}
          onClose={() => setEditCandidate(null)}
          onSave={handleSave}
        />
      )}
      {isTeacher && <RemoveClassMaterialModal material={removeCandidate} removing={materials.pending} onClose={() => setRemoveCandidate(null)} onConfirm={handleRemove} />}
    </section>
  )
}
