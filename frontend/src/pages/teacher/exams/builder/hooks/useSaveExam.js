import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import examService from '../../../../../services/examService'
import examMediaService from '../../../../../services/examMediaService'
import { clearExamDraft, loadExamDraft, saveExamDraft } from '../../draft/examDraftStorage'
import { validateExamForm, validateAllExamClasses } from '../../create/helpers/examFormValidation.js'
import useResourceQuery from '../../../../../query/useResourceQuery'
import { buildExamPayload, getExamConfig, orderExamSections } from '../helpers/examPayload.js'
import { validateExamBuilder } from '../helpers/examBuilderValidation.js'
import { focusExamError, isUncertainExamSave, mapExamApiErrors } from '../helpers/examApiErrors.js'
import { uploadExamMedia, validateExamMedia } from '../helpers/examMediaUpload.js'
import { importIllustrationTargets } from '../../create/helpers/pdfImportAdapter.js'

export default function useSaveExam({ builder, routeConfig, onValidationErrors, enabled = true }) {
  const navigate = useNavigate()
  const classesQuery = useResourceQuery('teacherClasses', [], { enabled: false })
  const importId = enabled ? loadExamDraft()?.pdfImport?.importId : null
  const importQuery = useResourceQuery('pdfExamImport', [importId], { enabled: false })
  const lock = useRef(false)
  const saveMutation = useMutation({ mutationFn: performSave })
  const saving = saveMutation.isPending
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

  async function performSave() {
    if (!enabled || lock.current || uncertain || loadExamDraft()?.pendingSave) return
    lock.current = true
    setMessage('')
    let sections = orderExamSections(builder.sections)
    let requestStarted = false
    try {
      const draft = loadExamDraft()
      const config = getExamConfig(draft, routeConfig)
      const configErrors = validateExamForm(config, config.accessType, config.classIds ?? [], config.studentIds ?? [])
      if (config.accessType === 'ALL') {
        const { data: classes } = await classesQuery.refetch({ throwOnError: true })
        const allClassesError = validateAllExamClasses(config.accessType, classes)
        if (allClassesError) configErrors.accessType = allClassesError
      }
      if (config.accessType === 'STUDENT' && (!Number.isSafeInteger(Number(config.classId)) || Number(config.classId) <= 0)) configErrors.accessType = 'Vui lòng chọn lại lớp và học sinh trước khi giao riêng đề.'
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
      if (draft?.pdfImport?.importId) {
        const review = loadExamDraft()?.pdfImport
        if (!review?.sourceReviewed) throw new Error('Vui lòng đối chiếu và xác nhận đã kiểm tra PDF nguồn trước khi lưu.')
        const result = await importQuery.refetch({ throwOnError: true })
        if (result.data?.status !== 'READY_FOR_REVIEW') throw new Error('Tác vụ import đã hết hạn hoặc không còn sẵn sàng để lưu.')
        payload.importReview = { importId: review.importId, sourceReviewed: true, illustrationAssetIds: review.illustrationAssetIds ?? [],
          illustrationTargets: importIllustrationTargets(sections, result.data.preview?.media ?? [], review.illustrationAssetIds ?? []) }
      }
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
      throw error
    } finally {
      lock.current = false
    }
  }

  const confirmRetry = () => {
    if (!window.confirm('Bạn đã kiểm tra danh sách và chắc chắn đề chưa được tạo? Gửi lại có thể tạo thêm đề nếu lần trước đã thành công.')) return
    if (!saveExamDraft({ pendingSave: null })) return
    setUncertain(false)
    setMessage('Đã mở lại nút lưu. Bấm Lưu đề thi khi bạn muốn gửi lại.')
  }
  const save = () => lock.current ? Promise.resolve() : saveMutation.mutateAsync().catch(() => {})
  return { save, saving, uncertain, message, confirmRetry }
}
