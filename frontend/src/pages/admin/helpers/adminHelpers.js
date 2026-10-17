export function getAdminErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback
}
