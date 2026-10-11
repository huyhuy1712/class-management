import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import attendanceService from '../../../../services/attendanceService'

export default function useSubmitAttendance(classId, onSuccess) {
  const attendanceMutation = useMutation({ mutationFn: (args) => attendanceService.attendAsStudent(...args) })
  const [step, setStep] = useState(null)
  const busy = attendanceMutation.isPending
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const password = useRef('')
  const lock = useRef(false)
  const submit = async (code, note) => {
    if (lock.current) return
    lock.current = true
    setError('')
    try {
      const records = await attendanceMutation.mutateAsync([classId, code, note])
      onSuccess(records)
      setSuccess('Điểm danh thành công!')
      setStep(null)
      password.current = ''
    } catch (exception) {
      if (exception.response?.data?.code === 'LATE_REASON_REQUIRED') {
        password.current = code
        setStep('late')
      } else setError(exception.response?.data?.message || 'Không thể điểm danh. Vui lòng thử lại.')
    } finally { lock.current = false }
  }
  return {
    step, busy, error, success,
    open: () => { setError(''); setSuccess(''); setStep('password') },
    close: () => { if (!lock.current) { setStep(null); password.current = ''; setError('') } },
    submitPassword: (code) => submit(code),
    submitReason: (note) => submit(password.current, note),
  }
}
