import { useEffect, useState } from 'react'
import useResourceQuery from '../../../../query/useResourceQuery'
import { canEnterAssignment } from '../helpers/studentExamHelpers'

export default function useStudentExamAssignment(assignmentId) {
  const query = useResourceQuery('studentAssignment', [assignmentId], { staleTime: 0, refetchInterval: 15_000, enabled: /^\d+$/.test(assignmentId ?? '') })
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return { ...query, canEnter: canEnterAssignment(query.data, now) }
}
