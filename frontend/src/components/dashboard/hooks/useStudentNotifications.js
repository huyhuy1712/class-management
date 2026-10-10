import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import notificationService from '../../../services/notificationService'

export default function useStudentNotifications() {
  const { pathname } = useLocation()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)

  useEffect(() => {
    let active = true
    notificationService.getMyNotifications()
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Invalid notifications response')
        if (active) { setNotifications(data.map((item) => ({ ...item, read: item.read ?? item.is_read ?? false }))); setError('') }
      })
      .catch(() => { if (active) setError('Không thể tải thông báo. Vui lòng tải lại trang.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [pathname])

  const run = async (action) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setActionError('')
    try { await action() }
    catch { setActionError('Không thể cập nhật thông báo. Vui lòng thử lại.') }
    finally { lock.current = false; setBusy(false) }
  }
  const onRead = (item) => {
    if (item.read) return
    return run(async () => {
      await notificationService.markRead(item.id)
      setNotifications((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))
    })
  }
  const onDelete = (id) => run(async () => {
    await notificationService.deleteNotification(id)
    setNotifications((current) => current.filter((item) => item.id !== id))
  })
  const onDeleteAll = () => run(async () => {
    const results = await Promise.allSettled(notifications.map((item) => notificationService.deleteNotification(item.id)))
    const deleted = new Set(notifications.filter((_, index) => results[index].status === 'fulfilled').map((item) => item.id))
    setNotifications((current) => current.filter((item) => !deleted.has(item.id)))
    if (results.some((item) => item.status === 'rejected')) throw new Error('Delete failed')
  })
  return { notifications, loading, error, actionError, busy, onRead, onDelete, onDeleteAll, unread: notifications.some((item) => !item.read) }
}
