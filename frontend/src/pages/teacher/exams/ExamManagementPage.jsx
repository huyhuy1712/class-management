import {
  ArrowDownUp,
  Plus,
  Search,
} from 'lucide-react'

import ResumeExamDraftModal from './components/ResumeExamDraftModal'
import { hasExamDraftContent } from './draft/hasExamDraftContent'
import { loadExamDraft, clearExamDraft } from './draft/examDraftStorage'
import useExams from './hooks/useExams'
import useExamUiSession from './hooks/useExamUiSession'
import ExamTable from './components/ExamTable'
import useExamFilters from './hooks/useExamFilters'
import DashboardLayout from '../../../layouts/DashboardLayout'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import examService from '../../../services/examService'
import EditExamModal from './components/EditExamModal'
import DeleteExamModal from './components/DeleteExamModal'


function ExamManagementPage() {

    const {
      exams,
      loading,
      error,
      refetch,
    } = useExams()

  const navigate = useNavigate()
  const { state } = useLocation()
  const [resumeDraftOpen, setResumeDraftOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [deletingExam, setDeletingExam] = useState(null)
  const [uiMessage, setUiMessage] = useState('')
  const uiExams = useExamUiSession((state) => state.exams)
  const clearExamPreview = useExamUiSession((state) => state.clearExamPreview)
  const updateUiExam = useExamUiSession((state) => state.updateExam)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [forceDelete, setForceDelete] = useState(false)

  const {
    search,
    setSearch,

    status,
    setStatus,

    sortOrder,
    setSortOrder,

    filteredExams,
  } = useExamFilters(exams.map((exam) => ({ ...exam, ...uiExams[exam.id] })))

  const handleCreate = () => {
    const draft = loadExamDraft()
    if (hasExamDraftContent(draft)) {
      setResumeDraftOpen(true)
      return
    }
    navigate('/teacher/exams/create')
  }

  const handleRestartDraft = () => {
    try {
      clearExamDraft()
      setResumeDraftOpen(false)
      navigate('/teacher/exams/create')
    } catch {
      setUiMessage('Không thể xóa bản nháp trên trình duyệt. Vui lòng thử lại.')
      setResumeDraftOpen(false)
    }
  }

  const handleView = (exam) => {
  navigate(`/teacher/exams/${exam.id}`, { state: { exam } })
}

  const handleEdit = (exam) => {
    setActionError('')
    setEditingExam(exam)
  }

  const handleTogglePublish = (exam) => {
    const status = exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    updateUiExam(exam, { status })
    setUiMessage(`Đã chuyển sang ${status === 'PUBLISHED' ? 'xuất bản' : 'bản nháp'} trên giao diện. Chưa cập nhật lên máy chủ.`)
  }

  const handleDelete = (exam) => {
    setActionError('')
    setForceDelete(false)
    setDeletingExam(exam)
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true)
      setActionError('')
      await examService.deleteExam(deletingExam.id, forceDelete)
      setDeletingExam(null)
      setForceDelete(false)
      await refetch()
    } catch (deleteError) {
      if (deleteError.response?.status === 409 && !forceDelete) {
        setForceDelete(true)
        setActionError('')
        return
      }
      setActionError(
        deleteError.response?.data?.message ||
          'Không thể xóa đề thi. Vui lòng thử lại.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1500px] pb-4 sm:pb-6 lg:pb-8">
        {state?.createdExam && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Đã lưu đề {state.createdExam.code} ở trạng thái nháp. Tổng điểm: {state.createdExam.maxScore}.</p>}
        {uiMessage && <p role="status" className="mb-4 text-sm text-slate-600">{uiMessage}</p>}
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#18301D] sm:text-3xl">
              Đề thi
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Tạo, quản lý và theo dõi các đề thi
              của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <Plus size={18} />
            Tạo đề thi
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          {/* SEARCH */}
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Tìm kiếm theo tên hoặc mã đề..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-50"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* STATUS FILTER */}
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-50"
            >
              <option value="ALL">
                Tất cả trạng thái
              </option>

              <option value="PUBLISHED">
                Đã xuất bản
              </option>

              <option value="DRAFT">
                Bản nháp
              </option>

              <option value="CLOSED">
                Đã đóng
              </option>
            </select>

            {/* SORT */}
            <div className="relative">
              <ArrowDownUp
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value,
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-600 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-50"
              >
                <option value="A_Z">Tên đề A → Z</option>
                <option value="NEWEST">
                  Mới nhất
                </option>

                <option value="OLDEST">
                  Cũ nhất
                </option>
              </select>

              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* RESULT */}
        <div className="mb-3">
          <p className="text-sm text-slate-500">
            Đang có{' '}
            <span className="font-semibold text-slate-700">
              {filteredExams.length}
            </span>{' '}
            đề thi
          </p>
        </div>

        {/* TABLE */}
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />

                <p className="mt-3 text-sm font-medium text-slate-400">
                  Đang tải danh sách đề thi...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-semibold text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={refetch}
                  className="mt-4 cursor-pointer rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : (
            <ExamTable
              exams={filteredExams}
              onView={handleView}
              onTogglePublish={handleTogglePublish}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
      </div>

      <ResumeExamDraftModal open={resumeDraftOpen} onClose={() => setResumeDraftOpen(false)} onContinue={() => { setResumeDraftOpen(false); navigate('/teacher/exams/create/online') }} onRestart={handleRestartDraft} />
      <EditExamModal
        exam={editingExam}
        open={Boolean(editingExam)}
        onClose={() => { setEditingExam(null); setActionError('') }}
        onSaved={(result) => { clearExamPreview(result.id); setEditingExam(null); setUiMessage('Đã lưu cấu hình đề thi.'); refetch() }}
      />

      <DeleteExamModal
        exam={deletingExam}
        open={Boolean(deletingExam)}
        deleting={deleting}
        forceRequired={forceDelete}
        error={deletingExam ? actionError : ''}
        onClose={() => { if (!deleting) { setDeletingExam(null); setForceDelete(false); setActionError('') } }}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  )
}

export default ExamManagementPage
