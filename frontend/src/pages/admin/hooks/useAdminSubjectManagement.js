import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useResourceQuery from '../../../query/useResourceQuery'
import subjectService from '../../../services/subjectService'
import { getAdminErrorMessage } from '../helpers/adminHelpers'
import { createSubjectForm, emptySubjectForm, filterSubjects } from '../helpers/subjectManagementHelpers'

export default function useAdminSubjectManagement() {
  const queryClient = useQueryClient()
  const { data: subjects = [], isPending, error, queryKey } = useResourceQuery('subjects')
  const [keyword, setKeyword] = useState('')
  const [modalMode, setModalMode] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [form, setForm] = useState(emptySubjectForm)
  const [formError, setFormError] = useState('')

  const refreshSubjects = () => queryClient.invalidateQueries({ queryKey })
  const createMutation = useMutation({
    mutationFn: subjectService.create,
    onSuccess: refreshSubjects,
  })
  const updateMutation = useMutation({
    mutationFn: ({ subjectId, subject }) => subjectService.update(subjectId, subject),
    onSuccess: refreshSubjects,
  })
  const deleteMutation = useMutation({
    mutationFn: subjectService.delete,
    onSuccess: refreshSubjects,
  })

  const filteredSubjects = useMemo(
    () => filterSubjects(subjects, keyword),
    [subjects, keyword],
  )
  const saving = createMutation.isPending || updateMutation.isPending

  function openCreateModal() {
    setSelectedSubject(null)
    setForm({ ...emptySubjectForm })
    setFormError('')
    setModalMode('create')
  }

  function openEditModal(subject) {
    setSelectedSubject(subject)
    setForm(createSubjectForm(subject))
    setFormError('')
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedSubject(null)
    setFormError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
    }
    const request = modalMode === 'create'
      ? createMutation.mutateAsync(payload)
      : updateMutation.mutateAsync({ subjectId: selectedSubject.id, subject: payload })

    request.then(closeModal).catch((mutationError) => {
      setFormError(getAdminErrorMessage(mutationError, 'Không thể lưu môn học. Vui lòng thử lại.'))
    })
  }

  function confirmDelete() {
    if (!pendingDelete) return

    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
      onError: (mutationError) => {
        window.alert(getAdminErrorMessage(mutationError, 'Không thể xóa môn học. Vui lòng thử lại.'))
      },
    })
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function closeDeleteModal() {
    if (!deleteMutation.isPending) setPendingDelete(null)
  }

  return {
    closeDeleteModal,
    closeModal,
    confirmDelete,
    createMutation,
    deleteMutation,
    error,
    filteredSubjects,
    form,
    formError,
    handleFormChange,
    handleSubmit,
    isPending,
    keyword,
    modalMode,
    openCreateModal,
    openEditModal,
    pendingDelete,
    saving,
    setKeyword,
    setPendingDelete,
    subjects,
  }
}
