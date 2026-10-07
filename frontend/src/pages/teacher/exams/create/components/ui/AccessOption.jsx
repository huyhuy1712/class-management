function AccessOption({
  selected,
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
        selected
          ? 'border-green-500 bg-green-50/60'
          : 'border-slate-200 bg-white hover:border-green-200'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          selected
            ? 'bg-green-100 text-green-600'
            : 'bg-slate-100 text-slate-400'
        }`}
      >
        <Icon size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${
            selected
              ? 'text-green-800'
              : 'text-slate-700'
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>

      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? 'border-green-600 bg-green-600'
            : 'border-slate-300'
        }`}
      >
        {selected && (
          <div className="h-2 w-2 rounded-full bg-white" />
        )}
      </div>
    </button>
  )
}

export default AccessOption