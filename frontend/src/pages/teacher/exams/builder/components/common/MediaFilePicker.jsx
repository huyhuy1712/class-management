import { Headphones, ImagePlus, X } from 'lucide-react'

const config = {
  image: {
    accept: 'image/*',
    icon: ImagePlus,
    empty: 'Chọn ảnh',
  },
  audio: {
    accept: 'audio/*',
    icon: Headphones,
    empty: 'Chọn audio',
  },
}

function MediaFilePicker({ type, file, onChange }) {
  const { accept, icon: Icon, empty } = config[type]

  return (
    <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs transition hover:border-emerald-300 hover:bg-emerald-50/40">
      <Icon size={16} className="shrink-0 text-emerald-600" />
      <span className="min-w-0 flex-1 truncate font-medium text-slate-500">
        {file?.name || empty}
      </span>
      {file && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            onChange(null)
          }}
          className="cursor-pointer text-slate-400 hover:text-red-500"
        >
          <X size={14} />
        </button>
      )}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  )
}

export default MediaFilePicker
