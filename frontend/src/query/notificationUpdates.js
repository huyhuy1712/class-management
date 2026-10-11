export function applyNotificationAction(items, action) {
  if (action.type === 'read') return items.map((item) => item.id === action.id ? { ...item, read: true } : item)
  return items.filter((item) => action.type === 'delete' ? item.id !== action.id : !action.ids.includes(item.id))
}

export function restoreNotifications(previous, deletedIds = []) {
  return previous.filter((item) => !deletedIds.includes(item.id))
}
