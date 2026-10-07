function ChoiceAnswer({ answer, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-4 w-4 shrink-0 rounded-full border-2 border-emerald-400" />
      <input
        value={answer.content}
        onChange={(event) => onChange({ content: event.target.value })}
        placeholder="Nhập phương án trả lời..."
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
      />
    </div>
  )
}

export default ChoiceAnswer
