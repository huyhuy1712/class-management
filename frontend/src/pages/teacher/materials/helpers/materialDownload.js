export function getMaterialDownloadName(title, fileName) {
  const extension = /\.([^.]+)$/.exec(fileName ?? '')?.[1]
  const unsafeCharacters = '<>:"/\\|?*'
  const safeTitle = Array.from(String(title ?? '').trim(), (character) =>
    unsafeCharacters.includes(character) || character.charCodeAt(0) < 32 ? '_' : character,
  ).join('').replace(/[. ]+$/g, '')
  const baseName = safeTitle || 'document'

  if (!extension || baseName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
    return baseName
  }

  return `${baseName}.${extension}`
}

export function getMaterialDownloadUrl(fileUrl, fileName, baseUrl = globalThis.location?.origin) {
  if (!fileUrl) return null

  try {
    const url = new URL(fileUrl, baseUrl)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.searchParams.set('download', fileName)
    return url.href
  } catch {
    return null
  }
}

export function getMaterialPreviewUrl(fileUrl, baseUrl = globalThis.location?.origin) {
  if (!fileUrl) return null

  try {
    const url = new URL(fileUrl, baseUrl)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}
