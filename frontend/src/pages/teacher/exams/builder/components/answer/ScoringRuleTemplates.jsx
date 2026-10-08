import { createContext, useContext, useState } from 'react'
import { validateGroupScore } from '../../helpers/examScoringValidation'

const TemplatesContext = createContext(null)

export function ScoringRuleTemplatesProvider({ children }) {
  const [templates, setTemplates] = useState([])
  return <TemplatesContext.Provider value={{ templates, add: (template) => setTemplates((current) => [...current, template]) }}>{children}</TemplatesContext.Provider>
}

function ScoringRuleTemplates({ rules, count, onApply }) {
  const { templates, add } = useContext(TemplatesContext)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const compatible = templates.filter((template) => template.count === count)
  const save = () => {
    const error = validateGroupScore({ answerType: 'TRUE_FALSE', scoreByCorrectCount: true, answers: Array.from({ length: count }), scoringRules: rules })
    if (!count || error) return setMessage(error || 'Thêm các ý đúng/sai trước khi lưu mẫu.')
    const title = name.trim()
    if (!title) return setMessage('Nhập tên mẫu rule.')
    if (templates.some((template) => template.name === title)) return setMessage('Tên mẫu đã tồn tại, hãy dùng tên khác.')
    add({ id: crypto.randomUUID(), name: title, count, rules: rules.map(({ correctCount, point }) => ({ correctCount, point })) })
    setName('')
    setMessage(`Đã lưu mẫu “${title}”.`)
  }
  return <div className="space-y-2 rounded-xl border border-amber-200 p-3">
    <p className="text-sm font-semibold text-slate-700">Mẫu rule · Chỉ giữ khi màn hình này đang mở</p>
    <div className="flex flex-wrap gap-2">
      <input aria-label="Tên mẫu rule" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Tên mẫu rule" className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" />
      <button type="button" onClick={save} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">Lưu mẫu rule</button>
    </div>
    <select aria-label="Dùng mẫu rule" value="" onChange={(event) => {
      const template = compatible.find((item) => item.id === event.target.value)
      if (!template) return
      onApply(template.rules.map((rule) => ({ ...rule, id: crypto.randomUUID() })))
      setMessage(`Đã áp dụng mẫu “${template.name}”.`)
    }} className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm">
      <option value="">{compatible.length ? `Dùng mẫu đã lưu (${count} ý)` : `Chưa có mẫu cho nhóm ${count} ý`}</option>
      {compatible.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
    </select>
    {message && <p role="status" className="text-sm text-amber-800">{message}</p>}
  </div>
}

export default ScoringRuleTemplates
