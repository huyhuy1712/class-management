import { Check } from 'lucide-react'

function Checkbox({ checked }) {
  return (
    <div
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
        checked
          ? 'border-green-600 bg-green-600 text-white'
          : 'border-slate-300 bg-white'
      }`}
    >
      {checked && (
        <Check
          size={14}
          strokeWidth={3}
        />
      )}
    </div>
  )
}

export default Checkbox