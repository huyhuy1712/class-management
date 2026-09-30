import axios from 'axios'

const baseURL = import.meta.env.DEV
  ? import.meta.env.VITE_API_LOCAL_URL
  : import.meta.env.VITE_API_PRODUCTION_URL

const api = axios.create({
  baseURL: import.meta.env.VITE_API_LOCAL_URL,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

export default api
