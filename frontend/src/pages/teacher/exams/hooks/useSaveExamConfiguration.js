import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import examService from '../../../../services/examService'
import { mapConfigurationErrors } from '../helpers/examConfigurationErrors'
import { buildExamConfigurationPayload, buildNewAssignmentPayload } from '../helpers/examConfigurationPayload'
import useResourceQuery from '../../../../query/useResourceQuery'
import { validateAllExamClasses } from '../create/helpers/examFormValidation'
import useAuthStore from '../../../../stores/authStore'

export default function useSaveExamConfiguration(examId, onSaved, mode = 'edit') {
  const newAssignment = mode === 'reassign'
  const requestId = useRef(null)
  const classesQuery = useResourceQuery('teacherClasses', [], { enabled: false })
  const saveMutation = useMutation({ mutationFn: async ([id, payload]) => {
    if (payload.assignment.assignmentType === 'ALL') {
      const { data: classes } = await classesQuery.refetch({ throwOnError: true })
      const allClassesError = validateAllExamClasses('ALL', classes)
      if (allClassesError) throw new Error(allClassesError)
    }
    return newAssignment ? examService.createAssignment(id, payload) : examService.updateExamConfiguration(id, payload)
  } })
  const lock = useRef(false)
  const saving = saveMutation.isPending
  const [error, setError] = useState('')
  const save = async (form, exam, onFieldErrors) => {
    if (lock.current || (newAssignment ? exam.status !== 'PUBLISHED' : exam.status !== 'DRAFT' || exam.assignment?.status !== 'DRAFT')) return
    lock.current = true
    setError('')
    try {
      const requestKey = `exam-reassign:${useAuthStore.getState().user?.id}:${examId}`
      requestId.current ??= newAssignment ? sessionStorage.getItem(requestKey) || crypto.randomUUID() : crypto.randomUUID()
      if (newAssignment) sessionStorage.setItem(requestKey, requestId.current)
      const payload = newAssignment ? buildNewAssignmentPayload(form, requestId.current) : buildExamConfigurationPayload(form, exam.assignment)
      const result = await saveMutation.mutateAsync([examId, payload])
      if (newAssignment) sessionStorage.removeItem(requestKey)
      onSaved(result)
    } catch (failure) {
      const body = failure.response?.data
      const fieldErrors = mapConfigurationErrors(body?.validationErrors)
      onFieldErrors?.(fieldErrors)
      setError(Object.keys(fieldErrors).length ? 'Vui lòng kiểm tra các ô được đánh dấu bên dưới.' : Object.values(body?.validationErrors ?? {}).join(' ') || body?.message || failure.message || 'Không thể lưu cấu hình. Vui lòng thử lại.')
    } finally {
      lock.current = false
      }
  }
  return { save, saving, error }
}
