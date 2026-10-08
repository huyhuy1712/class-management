import { Headphones, ImagePlus, X } from 'lucide-react'
import { Tooltip } from 'antd'
import MediaImagePreview from './MediaImagePreview'

const config = {
  image: {
    accept: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
    icon: ImagePlus,
    empty: 'Chọn ảnh',
  },
  audio: {
    accept: '.mp3,audio/mpeg',
    icon: Headphones,
    empty: 'Chọn audio',
  },
}

function MediaFilePicker({ type, file, onChange }) {
  const { accept, icon: Icon, empty } = config[type]

  return (
    <Tooltip title={type === 'image' && file ? <MediaImagePreview file={file} /> : null} trigger="hover" placement="top" destroyOnHidden>
    <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200/90 bg-slate-50/70 px-2.5 py-2 text-sm transition hover:border-emerald-200 hover:bg-emerald-50/50">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
        <Icon size={14} />
      </span>
      <span title={file?.name} className="min-w-0 flex-1 truncate font-medium text-slate-700">
        {file?.name || empty}
      </span>
      {file && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            onChange(null)
          }}
          className="cursor-pointer rounded-md p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
        >
          <X size={14} />
        </button>
      )}
      <input
        type="file"
        accept={accept}
        aria-label={empty}
        className="hidden"
        onChange={(event) => {
          const input = event.currentTarget
          const selected = input.files?.[0]
          input.value = ''
          if (selected) onChange(selected)
        }}
      />
    </label>
    </Tooltip>
  )
}

export default MediaFilePicker
