import { useEffect, useRef } from 'react'
import 'mathlive'
import MathToolbar from './MathToolbar'
import { handleMathBracketKey, MATH_ROW_KEYBINDINGS } from './mathBrackets'

function MathEditor({ value = '', onChange, placeholder = 'Nhập công thức...' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && ref.current.value !== value) ref.current.value = value
  }, [value])

  useEffect(() => {
    const field = ref.current
    if (!field) return
    const originalKeybindings = field.keybindings
    field.keybindings = [...originalKeybindings, ...MATH_ROW_KEYBINDINGS]
    const handleInput = () => onChange?.(field.value)
    const handleKeyDown = (event) => {
      if (handleMathBracketKey(event, field)) handleInput()
    }
    field.addEventListener('input', handleInput)
    field.addEventListener('keydown', handleKeyDown, true)
    return () => {
      if (field.isConnected) field.keybindings = originalKeybindings
      field.removeEventListener('input', handleInput)
      field.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [onChange])

  const insert = (latex) => {
    ref.current?.focus()
    ref.current?.insert(latex, { selectionMode: 'placeholder' })
    if (ref.current) onChange?.(ref.current.value)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
      <MathToolbar onInsert={insert} />
      <p className="border-b border-indigo-100 bg-indigo-50/30 px-3 py-2 text-xs text-slate-500">Gõ {'{'} hoặc [ để tạo hệ. Nhấn Enter để thêm dòng, dùng phím ↑ ↓ để chuyển dòng.</p>
      <math-field ref={ref} placeholder={placeholder} class="block min-h-[64px] w-full bg-white px-3 py-3 text-lg outline-none" />
    </div>
  )
}
export default MathEditor
