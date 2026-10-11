import { getSessionVersion, queryClient } from '../query/queryClient'
import { mutationResources, isAffectedQuery } from '../query/mutationResources'
import axios from 'axios'

const baseURL = import.meta.env.DEV
  ? import.meta.env.VITE_API_LOCAL_URL
  : import.meta.env.VITE_API_PRODUCTION_URL

const api = axios.create({
  baseURL,
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    config.querySessionVersion = getSessionVersion()
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use((response) => {
  const version = response.config.querySessionVersion
  if (version !== getSessionVersion()) throw new axios.CanceledError('Account session changed')
  const resources = mutationResources(response.config.url, response.config.method)
  if (resources.length && !response.config.skipQueryInvalidation) {
    // Let the caller apply its response to cache before refreshing affected observers.
    setTimeout(() => {
      if (version !== getSessionVersion()) return
      void queryClient.invalidateQueries({ predicate: (query) => isAffectedQuery(query.queryKey, response.config.url, response.config.method) })
    }, 0)
  }
  return response
})

export default api
