function TextAnswer({ answer, onChange }) {
  return (
    <input
      value={answer.content}
      onChange={(event) => onChange({ content: event.target.value })}
      placeholder="Nhập nội dung đáp án..."
      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
    />
  )
}

export default TextAnswer
