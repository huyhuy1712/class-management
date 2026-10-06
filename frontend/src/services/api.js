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
    return config
  },
  (error) => Promise.reject(error)
)

export default api
