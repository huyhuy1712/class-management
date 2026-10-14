import { Sparkles } from 'lucide-react'
import logo from '../assets/logos/logo.png'

export default function FrogLoading({ label = 'Đang tải...', className = '', compact = false }) {
  if (compact) return (
    <span role="status" aria-live="polite" className={`frog-loading-inline ${className}`}>
      <img src={logo} alt="" width={24} height={24} className="frog-loading-logo" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  )
  return (
    <div role="status" aria-live="polite" className={`frog-loading ${className}`}>
      <div className="frog-loading-art" aria-hidden="true">
        <Sparkles className="frog-loading-spark frog-loading-spark-left" />
        <Sparkles className="frog-loading-spark frog-loading-spark-right" />
        <img src={logo} alt="" width={120} height={120} className="frog-loading-logo" />
        <span className="frog-loading-shadow" />
      </div>
      <span className="frog-loading-name" aria-hidden="true">FROGH<span>...</span></span>
      <div className="frog-loading-track" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => <span key={index} style={{ '--frog-step': index }} />)}
      </div>
      <span className="frog-loading-label">{label}</span>
    </div>
  )
}
