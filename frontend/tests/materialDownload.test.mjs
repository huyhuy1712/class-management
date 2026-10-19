import test from 'node:test'
import assert from 'node:assert/strict'
import { getMaterialDownloadName, getMaterialDownloadUrl, getMaterialPreviewUrl } from '../src/pages/teacher/materials/helpers/materialDownload.js'

test('uses the material title and keeps the original file extension', () => {
  assert.equal(getMaterialDownloadName('Bài tập tuần 1', 'test.xlsx'), 'Bài tập tuần 1.xlsx')
  assert.equal(getMaterialDownloadName('Bài tập tuần 1.xlsx', 'test.xlsx'), 'Bài tập tuần 1.xlsx')
})

test('sanitizes filename characters and uses a fallback for an empty title', () => {
  assert.equal(getMaterialDownloadName('Bài: tập/tuần?', 'test.pdf'), 'Bài_ tập_tuần_.pdf')
  assert.equal(getMaterialDownloadName('', 'test.pdf'), 'document.pdf')
})

test('sets the requested download name on a valid file URL', () => {
  const result = new URL(getMaterialDownloadUrl('https://storage.example/material.xlsx?token=abc', 'Bài tập.xlsx', 'https://app.example'))
  assert.equal(result.searchParams.get('token'), 'abc')
  assert.equal(result.searchParams.get('download'), 'Bài tập.xlsx')
})

test('rejects unsafe file URL protocols', () => {
  assert.equal(getMaterialDownloadUrl('javascript:alert(1)', 'file.xlsx', 'https://app.example'), null)
})

test('returns a safe PDF preview URL without forcing a download', () => {
  assert.equal(
    getMaterialPreviewUrl('https://storage.example/document.pdf?token=abc', 'https://app.example'),
    'https://storage.example/document.pdf?token=abc',
  )
})
