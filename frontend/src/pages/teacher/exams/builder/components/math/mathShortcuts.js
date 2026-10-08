export const MATH_INLINE_SHORTCUTS = { vc: '\\infty' }

export function getMathTemplateHint(item) {
  if (item.symbol === '{' || item.symbol === '[') return `${item.label}\nGõ ${item.symbol}, nhấn Enter để thêm dòng`
  const latex = item.latex.replaceAll('\\placeholder{}', '{}')
  const shortcut = Object.entries(MATH_INLINE_SHORTCUTS).find(([, value]) => value === item.latex)?.[0]
  return `${item.label}\nLaTeX: ${latex}${shortcut ? `\nGõ nhanh: ${shortcut} → ${item.symbol}` : '\nGõ lệnh LaTeX rồi nhấn Space; dùng Tab để chuyển ô'}`
}
