import { useEffect, useRef } from 'react'
import 'mathlive'
import MathToolbar from './MathToolbar'

function MathEditor({ value = '', onChange, placeholder = 'Nhập công thức...' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && ref.current.value !== value) ref.current.value = value
  }, [value])

  useEffect(() => {
    const field = ref.current
    if (!field) return
    const handleInput = () => onChange?.(field.value)
    field.addEventListener('input', handleInput)
    return () => field.removeEventListener('input', handleInput)
  }, [onChange])

  const insert = (latex) => {
    ref.current?.focus()
    ref.current?.insert(latex)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
      <MathToolbar onInsert={insert} />
      <math-field ref={ref} placeholder={placeholder} class="block min-h-[64px] w-full bg-white px-3 py-3 text-lg outline-none" />
    </div>
  )
}
export default MathEditor
