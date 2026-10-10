import { useEffect, useState } from 'react'
import useAuthStore from '../../../stores/authStore'
import examService from '../../../services/examService'

export default function useTeacherExamCount(enabled = true) {
  const username = useAuthStore((state) => state.user?.username)
  const [result, setResult] = useState({ username: null, count: null, error: false })
  useEffect(() => {
    let active = true
    if (!enabled || !username) return
    // The API scopes exams to the authenticated teacher on the server.
    examService.getMyExams().then((exams) => {
      if (!Array.isArray(exams)) throw new Error('Invalid exam list')
      const count = new Set(exams.map((exam) => exam.id).filter((id) => id != null)).size
      if (active) setResult({ username, count, error: false })
    }).catch(() => {
      if (active) setResult({ username, count: null, error: true })
    })
    return () => { active = false }
  }, [username, enabled])
  if (!username || result.username !== username) return '...'
  return result.error ? '--' : result.count ?? '...'
}
