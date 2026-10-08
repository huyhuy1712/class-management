export function normalizePastedText(text) {
  return text.replace(/\r\n?/g, '\n')
    .split(/\n[\t ]*\n+/)
    .map((paragraph) => paragraph.replace(/[\t ]*\n[\t ]*/g, ' ').trim())
    .join('\n\n')
}
