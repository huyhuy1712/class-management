function TrueFalseAnswer({ answer, onChange }) {
  return (
    <select
      value={answer.content}
      onChange={(event) => onChange({ content: event.target.value })}
      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
    >
      <option value="Đúng">Đúng</option>
      <option value="Sai">Sai</option>
    </select>
  )
}

export default TrueFalseAnswer
