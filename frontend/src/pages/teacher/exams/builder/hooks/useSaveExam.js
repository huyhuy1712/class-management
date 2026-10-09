import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import examService from '../../../../../services/examService'
import examMediaService from '../../../../../services/examMediaService'
import { clearExamDraft, loadExamDraft, saveExamDraft } from '../../draft/examDraftStorage'
import { validateExamForm } from '../../create/helpers/examFormValidation.js'
import { buildExamPayload, getExamConfig, orderExamSections } from '../helpers/examPayload.js'
import { validateExamBuilder } from '../helpers/examBuilderValidation.js'
import { focusExamError, isUncertainExamSave, mapExamApiErrors } from '../helpers/examApiErrors.js'
import { uploadExamMedia, validateExamMedia } from '../helpers/examMediaUpload.js'

export default function useSaveExam({ builder, routeConfig, onValidationErrors, enabled = true }) {
  const navigate = useNavigate()
  const lock = useRef(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uncertain, setUncertain] = useState(() => enabled && Boolean(loadExamDraft()?.pendingSave))
  useEffect(() => {
    if (!saving) return
    const preventClose = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', preventClose)
    return () => window.removeEventListener('beforeunload', preventClose)
  }, [saving])

  const persist = (changes) => {
    if (!saveExamDraft(changes)) throw new Error('Không thể giữ bản nháp trên trình duyệt. Vui lòng kiểm tra dung lượng lưu trữ trước khi lưu đề.')
  }

  const save = async () => {
    if (!enabled || lock.current || uncertain || loadExamDraft()?.pendingSave) return
    lock.current = true
    setSaving(true)
    setMessage('')
    let sections = orderExamSections(builder.sections)
    let requestStarted = false
    try {
      const draft = loadExamDraft()
      const config = getExamConfig(draft, routeConfig)
      const configErrors = validateExamForm(config, config.accessType, config.classIds ?? [], config.studentIds ?? [])
      const validation = validateExamBuilder(sections)
      onValidationErrors(validation.errors)
      if (Object.keys(configErrors).length) {
        persist({ configErrors })
        setMessage('Cấu hình chung hoặc đối tượng giao đề chưa hợp lệ. Quay lại cấu hình để sửa.')
        return
      }
      if (!validation.isValid) { focusExamError(validation.firstErrorId); return }
      validateExamMedia(sections)
      const draftToken = draft?.draftToken ?? crypto.randomUUID()
      persist({ draftToken, builder: { sections }, configErrors: null })
      sections = await uploadExamMedia(sections, draftToken, (prepared) => {
        builder.replaceSections(prepared)
        persist({ builder: { sections: prepared } })
      }, examMediaService.upload)
      const payload = buildExamPayload(config, sections, draftToken)
      if (new TextEncoder().encode(JSON.stringify(payload)).length > 2 * 1024 * 1024) throw new Error('Nội dung đề vượt quá giới hạn 2 MiB. Vui lòng giảm nội dung.')
      persist({ pendingSave: { title: config.title, startedAt: new Date().toISOString() } })
      requestStarted = true
      const result = await examService.createExam(payload)
      if (!result?.id || !result?.code) throw new Error('Phản hồi lưu đề không đầy đủ.')
      clearExamDraft()
      navigate('/teacher/exams', { replace: true, state: { createdExam: result } })
    } catch (error) {
      // A lost response or server failure cannot prove that the transaction failed.
      if (isUncertainExamSave(error, requestStarted)) {
        setUncertain(true)
        setMessage('Chưa xác định được đề đã lưu hay chưa. Hãy kiểm tra danh sách đề trước khi gửi lại; bản nháp vẫn được giữ.')
      } else {
        if (requestStarted) saveExamDraft({ pendingSave: null })
        const mapped = mapExamApiErrors(error.response?.data?.validationErrors, sections)
        onValidationErrors(mapped.errors)
        if (Object.keys(mapped.configErrors).length) saveExamDraft({ configErrors: mapped.configErrors })
        setMessage(error.response?.data?.message || error.message || 'Không thể lưu đề. Bản nháp vẫn được giữ.')
        if (Object.keys(mapped.errors).length) focusExamError(Object.keys(mapped.errors)[0])
      }
    } finally {
      lock.current = false
      setSaving(false)
    }
  }

  const confirmRetry = () => {
    if (!window.confirm('Bạn đã kiểm tra danh sách và chắc chắn đề chưa được tạo? Gửi lại có thể tạo thêm đề nếu lần trước đã thành công.')) return
    if (!saveExamDraft({ pendingSave: null })) return
    setUncertain(false)
    setMessage('Đã mở lại nút lưu. Bấm Lưu đề thi khi bạn muốn gửi lại.')
  }
  return { save, saving, uncertain, message, confirmRetry }
}
