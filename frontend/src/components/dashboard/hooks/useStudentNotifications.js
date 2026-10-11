import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import useResourceQuery from '../../../query/useResourceQuery'
import { getSessionVersion, queryClient } from '../../../query/queryClient'
import notificationService from '../../../services/notificationService'
import { applyNotificationAction, restoreNotifications } from '../../../query/notificationUpdates'

export default function useStudentNotifications() {
  const query = useResourceQuery('notifications')
  const notifications = query.data ?? []
  const [actionError, setActionError] = useState('')
  const lock = useRef(false)
  const mutation = useMutation({
    mutationFn: async (action) => {
      if (action.version !== getSessionVersion()) throw new Error('Account session changed')
      if (action.type === 'read') return notificationService.markRead(action.id, { skipQueryInvalidation: true })
      if (action.type === 'delete') return notificationService.deleteNotification(action.id, { skipQueryInvalidation: true })
      const results = await Promise.allSettled(action.ids.map((id) => notificationService.deleteNotification(id, { skipQueryInvalidation: true })))
      if (results.some((result) => result.status === 'rejected')) {
        const error = new Error('Một số thông báo chưa xóa được. Vui lòng thử lại.')
        error.deletedIds = action.ids.filter((_, index) => results[index].status === 'fulfilled')
        throw error
      }
    },
    onMutate: async (action) => {
      const version = getSessionVersion()
      await queryClient.cancelQueries({ queryKey: query.queryKey, exact: true })
      const previous = queryClient.getQueryData(query.queryKey) ?? []
      query.setData(applyNotificationAction(previous, action))
      return { previous, version }
    },
    onError: (error, action, context) => {
      if (context?.version !== getSessionVersion()) return
      query.setData(restoreNotifications(context.previous, error.deletedIds))
      setActionError(error.deletedIds ? error.message : 'Không thể cập nhật thông báo. Vui lòng thử lại.')
    },
    onSettled: (_, __, ___, context) => {
      if (context?.version === getSessionVersion()) void queryClient.invalidateQueries({ queryKey: query.queryKey, exact: true })
    },
  })
  const run = async (action) => {
    if (lock.current) return
    lock.current = true
    setActionError('')
    try { await mutation.mutateAsync({ ...action, version: getSessionVersion() }) } catch { /* Error and rollback handled above. */ }
    finally { lock.current = false }
  }
  return {
    notifications, loading: query.isLoading, error: query.errorMessage, actionError, busy: mutation.isPending,
    onRead: (item) => item.read ? undefined : run({ type: 'read', id: item.id }),
    onDelete: (id) => run({ type: 'delete', id }),
    onDeleteAll: () => run({ type: 'deleteAll', ids: notifications.map((item) => item.id) }),
    unread: notifications.some((item) => !item.read),
  }
}
