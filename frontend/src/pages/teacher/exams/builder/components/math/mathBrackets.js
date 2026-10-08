export const MATH_BRACKETS = {
  '{': '\\begin{cases}\\placeholder{}\\end{cases}',
  '[': '\\left[\\begin{array}{l}\\placeholder{}\\end{array}\\right.',
}

export const MATH_ROW_KEYBINDINGS = [
  { key: '[Enter]', ifMode: 'math', command: 'addRowAfter' },
  { key: '[Return]', ifMode: 'math', command: 'addRowAfter' },
  { key: '[NumpadEnter]', ifMode: 'math', command: 'addRowAfter' },
]

export function handleMathBracketKey(event, field) {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return false
  const template = MATH_BRACKETS[event.key]
  if (template) {
    event.preventDefault()
    event.stopImmediatePropagation()
    field.insert(template, { selectionMode: 'placeholder' })
    return true
  }
  return false
}
