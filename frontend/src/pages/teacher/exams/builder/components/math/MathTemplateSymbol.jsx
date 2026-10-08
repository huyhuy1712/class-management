function MathTemplateSymbol({ item }) {
  const vector = item.latex.startsWith('\\vec{') || item.latex.startsWith('\\overrightarrow{')
  if (!vector) return item.symbol

  return (
    <span className="inline-flex flex-col items-center leading-none" aria-hidden="true">
      <svg width="24" height="7" viewBox="0 0 24 7" fill="none">
        <path d="M1 3.5H22M18.5 0.5L22 3.5L18.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{item.latex.startsWith('\\vec{') ? 'a' : 'AB'}</span>
    </span>
  )
}

export default MathTemplateSymbol
