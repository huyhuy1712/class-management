import { accountScope, resourceKey } from './queryKeys'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../stores/authStore'
import { getSessionVersion, setSessionQueryData } from './queryClient'
import { resourceOptions } from './resourceOptions'

export default function useResourceQuery(resource, params = [], options = {}) {
  const user = useAuthStore((state) => state.user)
  const version = getSessionVersion()
  const account = accountScope(user, version)
  const queryKey = resourceKey(account, resource, params)
  const { errorMessage, ...queryOptions } = options
  const query = useQuery({ ...resourceOptions(resource, params), ...queryOptions, queryKey, enabled: Boolean(account) && options.enabled !== false })
  const setData = (value) => {
    // An old modal/request must never recreate cache after logout/account switching.
    setSessionQueryData(queryKey, value, version)
  }
  return { ...query, setData, queryKey, loading: query.isLoading, errorMessage: query.isError && query.data === undefined ? query.error?.response?.data?.message || errorMessage || 'Không thể tải dữ liệu. Vui lòng thử lại.' : '' }
}
