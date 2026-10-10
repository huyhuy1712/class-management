import { useRef, useState } from 'react'
import attendanceService from '../../../../services/attendanceService'

export default function useSubmitAttendance(classId, onSuccess) {
  const [step, setStep] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const password = useRef('')
  const lock = useRef(false)
  const submit = async (code, note) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const records = await attendanceService.attendAsStudent(classId, code, note)
      onSuccess(records)
      setSuccess('Điểm danh thành công!')
      setStep(null)
      password.current = ''
    } catch (exception) {
      if (exception.response?.data?.code === 'LATE_REASON_REQUIRED') {
        password.current = code
        setStep('late')
      } else setError(exception.response?.data?.message || 'Không thể điểm danh. Vui lòng thử lại.')
    } finally { lock.current = false; setBusy(false) }
  }
  return {
    step, busy, error, success,
    open: () => { setError(''); setSuccess(''); setStep('password') },
    close: () => { if (!lock.current) { setStep(null); password.current = ''; setError('') } },
    submitPassword: (code) => submit(code),
    submitReason: (note) => submit(password.current, note),
  }
}
