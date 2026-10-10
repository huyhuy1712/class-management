import test from 'node:test'
import assert from 'node:assert/strict'
import { sortByText } from '../src/utils/sortByText.js'

test('sorts Vietnamese names, case and numeric labels without mutating input', () => {
  const items = ['Lớp 10', 'đạt', 'Bình', 'An', 'Lớp 2']
  const original = [...items]
  assert.deepEqual(sortByText(items), ['An', 'Bình', 'đạt', 'Lớp 2', 'Lớp 10'])
  assert.deepEqual(items, original)
})

test('supports selectors, puts missing labels last and preserves equal-label order', () => {
  const items = [{ id: 1 }, { id: 2, name: 'Bình' }, { id: 3, name: 'an' }, { id: 4, name: 'AN' }, { id: 5, name: ' ' }]
  assert.deepEqual(sortByText(items, (item) => item.name).map((item) => item.id), [3, 4, 2, 1, 5])
  assert.deepEqual(sortByText(), [])
})
