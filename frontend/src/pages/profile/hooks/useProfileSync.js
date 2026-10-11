import { useEffect } from 'react'
import useAuthStore from '../../../stores/authStore'
import useResourceQuery from '../../../query/useResourceQuery'
import { getSessionVersion } from '../../../query/queryClient'

export default function useProfileSync() {
  const user = useAuthStore((state) => state.user)
  const version = getSessionVersion()
  const query = useResourceQuery('profile', [user?.id], { enabled: Boolean(user?.id) })
  useEffect(() => {
    const current = useAuthStore.getState().user
    if (version !== getSessionVersion() || !current || !query.data || String(query.data.id) !== String(current.id)) return
    if (Object.entries(query.data).some(([key, value]) => current[key] !== value)) {
      useAuthStore.getState().updateUser(query.data)
    }
  }, [query.data, version])
  return query
}
