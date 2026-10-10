const vietnameseCollator = new Intl.Collator('vi', {
  usage: 'sort',
  sensitivity: 'base',
  numeric: true,
})

/** Return a sorted copy; blank labels go last and equal labels keep their order. */
export function sortByText(items = [], getLabel = (item) => item) {
  const label = (item) => String(getLabel(item) ?? '').trim().normalize('NFC')
  return [...items].sort((left, right) => {
    const a = label(left)
    const b = label(right)
    if (!a || !b) return a ? -1 : b ? 1 : 0
    return vietnameseCollator.compare(a, b)
  })
}
