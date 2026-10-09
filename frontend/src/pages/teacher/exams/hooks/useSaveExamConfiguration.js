import { useRef, useState } from 'react'
import examService from '../../../../services/examService'
import { mapConfigurationErrors } from '../helpers/examConfigurationErrors'
import { buildExamConfigurationPayload } from '../helpers/examConfigurationPayload'

export default function useSaveExamConfiguration(examId, onSaved) {
  const lock = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const save = async (form, exam, onFieldErrors) => {
    if (lock.current || exam.status !== 'DRAFT' || exam.assignment?.status !== 'DRAFT') return
    lock.current = true
    setSaving(true)
    setError('')
    try {
      const result = await examService.updateExamConfiguration(examId, buildExamConfigurationPayload(form, exam.assignment))
      onSaved(result)
    } catch (failure) {
      const body = failure.response?.data
      const fieldErrors = mapConfigurationErrors(body?.validationErrors)
      onFieldErrors?.(fieldErrors)
      setError(Object.keys(fieldErrors).length ? 'Vui lòng kiểm tra các ô được đánh dấu bên dưới.' : body?.message || failure.message || 'Không thể lưu cấu hình. Vui lòng thử lại.')
    } finally {
      lock.current = false
      setSaving(false)
    }
  }
  return { save, saving, error }
}
