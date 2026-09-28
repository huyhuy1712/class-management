import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function FeatureCard({
  title,
  description,
  icon: Icon,
  path,
}) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(path)}
      className="group relative w-full overflow-hidden rounded-2xl border border-green-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg hover:shadow-green-900/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700 transition group-hover:bg-green-600 group-hover:text-white">
          <Icon size={23} strokeWidth={1.8} />
        </div>

        <ArrowUpRight
          size={18}
          className="text-gray-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-green-600"
        />
      </div>

      <h3 className="mt-5 font-semibold text-gray-800">
        {title}
      </h3>

      <p className="mt-1.5 text-sm leading-6 text-gray-400">
        {description}
      </p>
    </button>
  )
}

export default FeatureCard