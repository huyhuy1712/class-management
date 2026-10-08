import { useEffect, useRef } from 'react'

function MediaImagePreview({ file }) {
  const ref = useRef(null)
  useEffect(() => {
    const local = file instanceof Blob
    const src = local ? URL.createObjectURL(file) : file?.url
    if (ref.current && src) ref.current.src = src
    return () => { if (local && src) URL.revokeObjectURL(src) }
  }, [file])

  return <img ref={ref} alt={file?.name || 'Ảnh đã chọn'} className="block h-auto max-h-[240px] w-full max-w-full rounded-lg object-contain" />
}

export default MediaImagePreview
