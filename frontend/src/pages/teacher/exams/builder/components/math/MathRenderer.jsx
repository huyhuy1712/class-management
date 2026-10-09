import { convertLatexToMarkup } from 'mathlive'
import 'mathlive/fonts.css'
import 'mathlive/static.css'

function MathRenderer({ content = '', className = '' }) {
  const parts = String(content).split(/(\$[^$]+\$)/g)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const latex = part.slice(1, -1)
          return <span key={index} className="mx-0.5 inline-block" dangerouslySetInnerHTML={{ __html: convertLatexToMarkup(latex) }} />
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}
export default MathRenderer
