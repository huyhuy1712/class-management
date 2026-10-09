import { Sigma, X } from 'lucide-react'
import { useState } from 'react'
import MathEditor from './MathEditor'
import MathRenderer from './MathRenderer'
import { normalizePastedText } from '../../helpers/normalizePastedText'

function MathContentInput({ value = '', onChange, placeholder = 'Nhập nội dung...', rows = 3 }) {
  const [open, setOpen] = useState(false)
  const [formula, setFormula] = useState('')

  const handlePaste = (event) => {
    const text = event.clipboardData.getData('text/plain')
    if (!text || !/[\r\n]/.test(text)) return
    event.preventDefault()
    const input = event.currentTarget
    const start = input.selectionStart
    const end = input.selectionEnd
    const pasted = normalizePastedText(text)
    onChange(`${value.slice(0, start)}${pasted}${value.slice(end)}`)
    requestAnimationFrame(() => {
      if (input.isConnected) input.setSelectionRange(start + pasted.length, start + pasted.length)
    })
  }

  const insertFormula = () => {
    if (!formula.trim()) return
    const separator = value && !value.endsWith(' ') ? ' ' : ''
    onChange(`${value}${separator}$${formula}$`)
    setFormula('')
    setOpen(false)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-emerald-400">
      <textarea onPaste={handlePaste} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full resize-none bg-transparent px-3 py-2.5 text-base font-medium leading-7 outline-none" />
      {/\$[^$]+\$/.test(value) && <div className="border-t border-slate-100 px-3 py-2"><p className="mb-1 text-xs font-medium text-slate-500">Xem trước</p><MathRenderer content={value} className="whitespace-pre-wrap text-base font-normal leading-7" /></div>}
      <div className="flex items-center border-t border-slate-100 bg-slate-50/80 px-2 py-1.5">
        <button type="button" onClick={() => setOpen((current) => !current)} className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold transition ${open ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'}`}>
          <Sigma size={14} /> Chèn công thức
        </button>
      </div>
      {open && (
        <div className="border-t border-indigo-100 bg-indigo-50/30 p-3">
          <div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold text-indigo-700">Soạn công thức toán</p><button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-700"><X size={15}/></button></div>
          <MathEditor value={formula} onChange={setFormula} />
          <div className="mt-2 flex justify-end"><button type="button" onClick={insertFormula} disabled={!formula.trim()} className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">Chèn vào nội dung</button></div>
        </div>
      )}
    </div>
  )
}
export default MathContentInput
