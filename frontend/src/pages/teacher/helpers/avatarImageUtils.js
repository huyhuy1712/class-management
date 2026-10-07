const AVATAR_MAX_DIMENSION = 512
const AVATAR_QUALITY = 0.82

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Không thể đọc ảnh đại diện.'))
    }

    image.src = url
  })

export async function optimizeAvatar(file) {
  const image = await loadImage(file)
  const scale = Math.min(1, AVATAR_MAX_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) return file

  context.drawImage(image, 0, 0, width, height)

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp'
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, outputType, AVATAR_QUALITY),
  )

  if (!blob || blob.size >= file.size) return file

  const extension = outputType === 'image/png' ? 'png' : 'webp'
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar'

  return new File([blob], `${baseName}.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  })
}
