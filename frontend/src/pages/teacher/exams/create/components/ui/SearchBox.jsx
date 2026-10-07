import { Search } from 'lucide-react'

function SearchBox({
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search
        size={17}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-50"
      />
    </div>
  )
}

export default SearchBox