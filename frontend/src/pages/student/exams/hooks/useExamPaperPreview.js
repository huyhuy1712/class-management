import { useEffect, useMemo, useState } from 'react'
import { isQuestionAnswered } from '../helpers/examPaperHelpers'

export default function useExamPaperPreview(paper) {
  const questions = useMemo(() => paper.sections.flatMap((section) => section.questions), [paper])
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState([])
  const [deadline] = useState(() => Date.now() + paper.durationMinutes * 60_000)
  const [now, setNow] = useState(Date.now)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))
  const locked = submitted || remaining === 0
  const answered = questions.filter((question) => isQuestionAnswered(question, answers[question.id])).length
  const changeAnswer = (id, value) => { if (!locked) setAnswers((current) => ({ ...current, [id]: value })) }
  const toggleFlag = (id) => setFlags((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const submit = () => { setSubmitted(true); setConfirmOpen(false) }
  return { questions, answers, flags, answered, remaining, locked, submitted, confirmOpen, setConfirmOpen, changeAnswer, toggleFlag, submit }
}
