import { getSessionVersion, queryClient } from './queryClient.js'

export function patchRow(rows, id, patch) {
  return rows?.map((row) => String(row.id) === String(id) ? { ...row, ...patch } : row)
}

export function rollbackRow(rows, id, patch, previous) {
  if (!previous) return rows
  return rows?.map((row) => {
    if (String(row.id) !== String(id)) return row
    const restored = { ...row }
    for (const [field, value] of Object.entries(patch)) {
      // Preserve changes made by another operation after this optimistic update.
      if (row[field] === value) {
        if (Object.hasOwn(previous, field)) restored[field] = previous[field]
        else delete restored[field]
      }
    }
    return restored
  })
}

export function optimisticRowOptions(query, getChange, action) {
  const version = getSessionVersion()
  return {
    mutationFn: (variables) => {
      if (version !== getSessionVersion()) throw new Error('Account session changed')
      return action(variables)
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: query.queryKey, exact: true })
      if (version !== getSessionVersion()) return undefined
      const { id, patch } = getChange(variables)
      const previous = queryClient.getQueryData(query.queryKey)?.find((row) => String(row.id) === String(id))
      query.setData((rows) => patchRow(rows, id, patch))
      return { id, patch, previous }
    },
    onError: (_, __, context) => {
      if (context && version === getSessionVersion()) query.setData((rows) => rollbackRow(rows, context.id, context.patch, context.previous))
    },
    onSettled: (_, error) => {
      // Successful writes already invalidate related resources in the Axios layer.
      if (error && version === getSessionVersion()) void queryClient.invalidateQueries({ queryKey: query.queryKey, exact: true })
    },
  }
}
