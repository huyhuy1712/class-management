import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import useResourceQuery from '../../../../query/useResourceQuery'
import examService from '../../../../services/examService'
import useAuthStore from '../../../../stores/authStore'
import { getSessionVersion } from '../../../../query/queryClient'
import { adaptAttemptSections, buildAttemptAnswers, readAttemptAnswers } from '../helpers/examAttemptAdapter'
import { isQuestionAnswered } from '../helpers/examPaperHelpers'

export default function useExamAttempt(attemptId) {
  const query = useResourceQuery('examAttempt', [attemptId], { staleTime: 0 })
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const sections = useMemo(() => adaptAttemptSections(query.data?.sections), [query.data?.sections])
  const questions = useMemo(() => sections.flatMap((section) => section.questions), [sections])
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState([])
  const [now, setNow] = useState(Date.now)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [conflicted, setConflicted] = useState(false)
  const state = useRef(null)
  const pending = useRef(null)
  const submitting = useRef(false)
  const expiredSubmit = useRef(false)
  const serverTime = Date.parse(query.data?.serverTime)
  const clockOffset = Number.isFinite(serverTime) ? serverTime - query.dataUpdatedAt : 0
  const version = useRef(getSessionVersion())
  const saveMutation = useMutation({ mutationFn: (body) => examService.saveAttempt(attemptId, body), retry: false })
  const submitMutation = useMutation({ mutationFn: async () => {
    await pending.current
    if (state.current.paused) throw new Error('Bài đã thay đổi ở phiên khác. Tải lại trang để đồng bộ trước khi nộp.')
    if (version.current !== getSessionVersion()) throw new Error('Phiên đăng nhập đã thay đổi.')
    return examService.submitAttempt(attemptId, body())
  }, retry: false })
  const key = query.data ? `exam-draft:${user?.id}:${attemptId}:${query.data.attemptNumber}` : null
  const store = () => {
    if (!key || !state.current || version.current !== getSessionVersion()) return
    try { localStorage.setItem(key, JSON.stringify(state.current)) } catch { setError('Không thể giữ bản nháp trên thiết bị. Vui lòng kiểm tra trạng thái lưu lên máy chủ.') }
  }

  useEffect(() => {
    const attempt = query.data
    if (!attempt) return
    if (attempt.status !== 'IN_PROGRESS') { navigate(`/student/exam-attempts/${attemptId}/result`, { replace: true }); return }
    if (state.current && (attempt.attemptNumber !== state.current.attemptNumber || (!pending.current && attempt.revision > state.current.revision))) {
      state.current.paused = true
      setConflicted(true)
      setError('Lượt thi đã thay đổi ở phiên khác. Tải lại trang để đồng bộ trước khi tiếp tục.')
      return
    }
    if (state.current) return
    let draft
    try { draft = JSON.parse(localStorage.getItem(key)) } catch { /* Use saved server answers. */ }
    const recovered = draft?.revision === attempt.revision && draft?.attemptNumber === attempt.attemptNumber
    const values = recovered ? draft.answers : readAttemptAnswers(questions, attempt.answers)
    state.current = { answers: values, events: recovered ? draft.events ?? [] : [], revision: attempt.revision, attemptNumber: attempt.attemptNumber, dirty: recovered && Boolean(draft.dirty), paused: false }
    setAnswers(values)
    setInitialized(true)
  }, [query.data, key, attemptId, questions, navigate])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const remaining = query.data?.deadline ? Math.max(0, Math.ceil((Date.parse(query.data.deadline) - now - clockOffset) / 1000)) : 0
  const locked = !initialized || conflicted || remaining === 0 || submitMutation.isPending || query.data?.status !== 'IN_PROGRESS'
  const changeAnswer = (id, value) => {
    if (locked || submitting.current) return
    const next = { ...state.current.answers, [id]: value }
    state.current.answers = next
    state.current.dirty = true
    setAnswers(next)
    store()
  }
  const body = () => ({ attemptNumber: state.current.attemptNumber, revision: state.current.revision, answers: buildAttemptAnswers(questions, state.current.answers), events: state.current.events.slice(0, 1000) })
  const save = async () => {
    if (pending.current) return pending.current
    if (!state.current?.dirty || state.current.paused || submitting.current || query.data?.status !== 'IN_PROGRESS' || version.current !== getSessionVersion()) return
    const payload = body()
    const snapshot = state.current.answers
    const sentEvents = new Set(payload.events.map((event) => event.eventId))
    pending.current = (async () => {
      try {
        const result = await saveMutation.mutateAsync(payload)
        if (version.current !== getSessionVersion()) return
        state.current.revision = result.revision
        state.current.events = state.current.events.filter((event) => !sentEvents.has(event.eventId))
        state.current.dirty = state.current.answers !== snapshot || state.current.events.length > 0
        query.setData((previous) => ({ ...previous, ...result, sections: previous.sections, answers: previous.answers }))
        setSavedAt(new Date())
        setError('')
        store()
        if (result.status !== 'IN_PROGRESS') navigate(`/student/exam-attempts/${attemptId}/result`, { replace: true })
      } catch (failure) {
        if (failure.response?.status === 409) { state.current.paused = true; setConflicted(true) }
        setError(failure.response?.data?.message || 'Chưa lưu được đáp án. Bản nháp vẫn được giữ trên thiết bị; hệ thống sẽ thử lại.')
      } finally { pending.current = null }
    })()
    return pending.current
  }
  const submit = async () => {
    if (submitting.current || !state.current || version.current !== getSessionVersion()) return
    submitting.current = true
    try {
      await submitMutation.mutateAsync()
      if (version.current !== getSessionVersion()) return
      localStorage.removeItem(key)
      setConfirmOpen(false)
      navigate(`/student/exam-attempts/${attemptId}/result`, { replace: true })
    } catch (failure) {
      if (failure.response?.status === 409) { state.current.paused = true; setConflicted(true) }
      setError(failure.response?.data?.message || failure.message || 'Chưa nộp được bài. Vui lòng thử lại.')
    } finally { submitting.current = false }
  }
  const actions = useRef(null)
  useEffect(() => { actions.current = { save, submit, store } })
  useEffect(() => {
    if (!initialized) return
    const timer = setInterval(() => { void actions.current.save() }, 5000)
    const visibility = () => {
      if (version.current !== getSessionVersion() || !state.current || submitting.current) return
      state.current.events.push({ eventId: crypto.randomUUID(), type: document.hidden ? 'TAB_HIDDEN' : 'TAB_VISIBLE' })
      state.current.dirty = true
      actions.current.store()
      void actions.current.save()
    }
    const unload = (event) => {
      actions.current.store()
      event.preventDefault()
      event.returnValue = ''
    }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('beforeunload', unload)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('beforeunload', unload) }
  }, [initialized])
  useEffect(() => {
    if (initialized && remaining === 0 && !expiredSubmit.current) { expiredSubmit.current = true; void actions.current.submit() }
  }, [remaining, initialized])
  const answered = questions.filter((question) => isQuestionAnswered(question, answers[question.id])).length
  return { query, sections, questions, answers, flags, answered, remaining, locked, error, savedAt, saving: saveMutation.isPending,
    submitting: submitMutation.isPending, confirmOpen, setConfirmOpen, changeAnswer, submit, save,
    toggleFlag: (id) => setFlags((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) }
}
