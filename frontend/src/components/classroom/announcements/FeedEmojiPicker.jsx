import { lazy, Suspense, useState } from 'react'
import { SmilePlus } from 'lucide-react'

const EmojiPicker = lazy(() => import('emoji-picker-react'))

function renderEmoji(emojiCode) {
  return String.fromCodePoint(...emojiCode.split('-').map((codePoint) => Number.parseInt(codePoint, 16)))
}

export default function FeedEmojiPicker({ reactions = [], onSelect, disabled = false, label = 'Thêm cảm xúc' }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex items-center gap-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emojiCode}
          type="button"
          aria-pressed={reaction.reactedByMe}
          disabled={disabled}
          onClick={() => onSelect(reaction.emojiCode)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition disabled:opacity-60 ${reaction.reactedByMe ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          title={`${reaction.count} lượt`}
        >
          <span aria-hidden="true" className="text-base leading-none">{renderEmoji(reaction.emojiCode)}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-60"
      >
        <SmilePlus size={17} />
        <span className="sr-only">{label}</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
          <Suspense fallback={<div className="flex h-[350px] w-[300px] items-center justify-center text-sm text-slate-400">Đang tải emoji...</div>}>
            <EmojiPicker
              width={300}
              height={350}
              lazyLoadEmojis
              searchPlaceHolder="Tìm emoji..."
              previewConfig={{ showPreview: false }}
              onEmojiClick={(emojiData) => {
                onSelect(emojiData.unified)
                setOpen(false)
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
