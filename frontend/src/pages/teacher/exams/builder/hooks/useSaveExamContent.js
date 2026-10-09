import { useRef, useState } from 'react'
import examService from '../../../../../services/examService'
import examMediaService from '../../../../../services/examMediaService'
import { orderExamSections } from '../helpers/examPayload'
import { buildExamContentPayload, applyContentIdMappings } from '../helpers/examContentPayload'
import { validateExamBuilder } from '../helpers/examBuilderValidation'
import { validateExamMedia, uploadExamMedia } from '../helpers/examMediaUpload'
import { mapExamApiErrors, focusExamError } from '../helpers/examApiErrors'

export default function useSaveExamContent({ exam, builder, readOnly, onValidationErrors }) {
  const lock = useRef(false)
  const revision = useRef(exam?.revision)
  const token = useRef(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const save = async () => {
    if (!exam || readOnly || lock.current) return
    lock.current = true
    setSaving(true)
    setMessage('')
    let sections = orderExamSections(builder.sections)
    try {
      const validation = validateExamBuilder(sections)
      onValidationErrors(validation.errors)
      if (!validation.isValid) { focusExamError(validation.firstErrorId); return }
      if (!Number.isSafeInteger(revision.current)) throw new Error('Thiếu phiên bản đề thi. Vui lòng tải lại trang trước khi lưu.')
      validateExamMedia(sections)
      token.current ??= crypto.randomUUID()
      sections = await uploadExamMedia(sections, token.current, builder.replaceSections, examMediaService.upload)
      const payload = buildExamContentPayload(sections, revision.current, token.current)
      if (new TextEncoder().encode(JSON.stringify(payload)).length > 2 * 1024 * 1024) throw new Error('Nội dung đề vượt quá giới hạn 2 MiB.')
      const result = await examService.updateExamContent(exam.id, payload)
      revision.current = result.revision
      builder.replaceSections(applyContentIdMappings(sections, result.idMappings))
      setMessage('Đã lưu chỉnh sửa nội dung đề thi.')
    } catch (error) {
      const mapped = mapExamApiErrors(error.response?.data?.validationErrors, sections)
      onValidationErrors(mapped.errors)
      if (Object.keys(mapped.errors).length) focusExamError(Object.keys(mapped.errors)[0])
      setMessage(error.response?.data?.message || error.message || 'Không thể lưu chỉnh sửa. Vui lòng thử lại.')
    } finally {
      lock.current = false
      setSaving(false)
    }
  }
  return { save, saving, message }
}
