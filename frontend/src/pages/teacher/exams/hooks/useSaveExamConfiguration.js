import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import examService from '../../../../services/examService'
import { mapConfigurationErrors } from '../helpers/examConfigurationErrors'
import { buildExamConfigurationPayload } from '../helpers/examConfigurationPayload'

export default function useSaveExamConfiguration(examId, onSaved) {
  const saveMutation = useMutation({ mutationFn: (args) => examService.updateExamConfiguration(...args) })
  const lock = useRef(false)
  const saving = saveMutation.isPending
  const [error, setError] = useState('')
  const save = async (form, exam, onFieldErrors) => {
    if (lock.current || exam.status !== 'DRAFT' || exam.assignment?.status !== 'DRAFT') return
    lock.current = true
    setError('')
    try {
      const result = await saveMutation.mutateAsync([examId, buildExamConfigurationPayload(form, exam.assignment)])
      onSaved(result)
    } catch (failure) {
      const body = failure.response?.data
      const fieldErrors = mapConfigurationErrors(body?.validationErrors)
      onFieldErrors?.(fieldErrors)
      setError(Object.keys(fieldErrors).length ? 'Vui lòng kiểm tra các ô được đánh dấu bên dưới.' : body?.message || failure.message || 'Không thể lưu cấu hình. Vui lòng thử lại.')
    } finally {
      lock.current = false
      }
  }
  return { save, saving, error }
}
