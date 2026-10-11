import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: true,
      retry: (count, error) => count < 1 && ![400, 401, 403, 404, 409, 422].includes(error?.response?.status),
    },
    mutations: { retry: false },
  },
})

let sessionVersion = 0
export const getSessionVersion = () => sessionVersion

export function resetQuerySession() {
  sessionVersion += 1
  void queryClient.cancelQueries()
  queryClient.clear()
}

export function setSessionQueryData(queryKey, value, version) {
  if (version === sessionVersion) queryClient.setQueryData(queryKey, value)
}
