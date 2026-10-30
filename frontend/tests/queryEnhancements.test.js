import test from 'node:test'
import assert from 'node:assert/strict'
import { routeQueries } from '../src/query/prefetchRoutes.js'
import { patchRow, rollbackRow, optimisticRowOptions } from '../src/query/optimisticUpdates.js'
import { queryClient, getSessionVersion, resetQuerySession, setSessionQueryData } from '../src/query/queryClient.js'
import { resourceKey } from '../src/query/queryKeys.js'
import { mutationResources } from '../src/query/mutationResources.js'

test('detail prefetch uses the same class, date and exam parameters as page queries', () => {
  assert.deepEqual(routeQueries('/student/classes/21', 7, '2026-10-11'), [
    ['studentClasses', []], ['classStudents', ['21']], ['attendances', ['21']], ['lessons', ['21', '2026-10-11']],
  ])
  assert.deepEqual(routeQueries('/teacher/classes/21', 7, '2026-10-11'), [['teacherClasses', []], ['classStudents', ['21']]])
  assert.ok(routeQueries('/teacher/classes/21/attendance', 7, '2026-10-11').some(([name]) => name === 'attendances'))
  assert.deepEqual(routeQueries('/teacher/exams/42', 7), [['examDetail', ['42']], ['examConfiguration', ['42']]])
  assert.deepEqual(routeQueries('/teacher/exams/create', 7), [['subjects', []], ['teacherClasses', []], ['teacherStudents', []]])
  assert.ok(routeQueries('/teacher', 7).some(([name]) => name === 'teacherHomeworks'))
  assert.ok(routeQueries('/student', 7).some(([name]) => name === 'studentHomeworks'))
  assert.deepEqual(routeQueries('/teacher/classes/21/assignments', 7), [['teacherClasses', []], ['classExams', ['21']]])
  assert.deepEqual(routeQueries('/teacher/classes/21/homework', 7), [['classHomeworks', ['21']]])
  assert.deepEqual(routeQueries('/teacher/homework', 7), [['teacherHomeworks', []]])
  assert.deepEqual(routeQueries('/teacher/homework?classId=21', 7), [['teacherHomeworks', ['21']]])
  assert.deepEqual(routeQueries('/teacher/homework/create?classId=21', 7), [['teacherClasses', []], ['teacherStudents', []]])
  assert.deepEqual(routeQueries('/teacher/homework/19?classId=21', 7), [['teacherHomework', ['19']], ['homeworkSubmissions', ['19', '21']]])
  assert.deepEqual(routeQueries('/teacher/homework/19/submissions/23?classId=21', 7), [['teacherHomework', ['19']], ['homeworkSubmissions', ['19', '21']]])
  assert.ok(mutationResources('/exams/7/publish', 'patch').includes('classExams'))
  assert.ok(mutationResources('/exam-attempts/42/grades', 'patch').includes('classExams'))
  assert.ok(mutationResources('/exam-attempts/42/grades', 'patch').includes('teacherAssignmentAttempts'))
  assert.ok(mutationResources('/exam-attempts/42/reset', 'post').includes('teacherAttemptReview'))
  assert.deepEqual(routeQueries('/teacher/exams/7/assignments/8/attempts/42?classId=21', 7), [['teacherAttemptReview', ['42']]])
  assert.deepEqual(routeQueries('/teacher/exams/7/assignments/8?classId=21', 7), [['examConfiguration', ['7']], ['teacherAssignmentAttempts', ['8', '21', 0, 12, '', '', 'newest']]])
  assert.deepEqual(routeQueries('/student/exams/42', 7), [['studentAssignment', ['42']]])
  assert.deepEqual(routeQueries('/student/profile', 7), [['profile', [7]]])
  assert.deepEqual(routeQueries('/teacher/billing?orderId=order-1', 7), [
    ['billing', []], ['billingOrder', ['order-1']],
  ])
  assert.deepEqual(routeQueries('/teacher/billing', 7), [['billing', []]])
  assert.deepEqual(mutationResources('/billing/vip/redeem', 'post'), ['billing'])
})

test('announcement routes prefetch the first page of the class feed', () => {
  assert.deepEqual(routeQueries('/teacher/classes/21/announcements', 7), [['classFeedPosts', ['21', 0, 20]]])
  assert.deepEqual(routeQueries('/student/classes/21/announcements', 7), [['classFeedPosts', ['21', 0, 20]]])
})

test('optimistic patch and rollback preserve unrelated rows, new changes and missing fields', () => {
  const original = [{ id: 21, name: 'Toán', status: 'ACTIVE' }, { id: 22, name: 'Anh' }]
  const patch = { name: 'Toán 12', description: 'Mới' }
  const optimistic = patchRow(original, '21', patch)
  assert.equal(original[0].name, 'Toán')
  assert.equal(optimistic[1], original[1])
  const current = [{ ...optimistic[0], status: 'ARCHIVED', description: 'Chỉnh sửa khác' }, ...optimistic.slice(1)]
  const restored = rollbackRow(current, 21, patch, original[0])
  assert.equal(restored[0].name, 'Toán')
  assert.equal(restored[0].status, 'ARCHIVED')
  assert.equal(restored[0].description, 'Chỉnh sửa khác')
  assert.equal(Object.hasOwn(rollbackRow(optimistic, 21, patch, original[0])[0], 'description'), false)
  assert.deepEqual(rollbackRow([], 21, patch, original[0]), [])
})

test('optimistic mutation changes cache before the API finishes and restores it on rejection', async () => {
  const version = getSessionVersion()
  const key = resourceKey('teacher:7', 'teacherClasses')
  const query = { queryKey: key, setData: (value) => setSessionQueryData(key, value, version) }
  queryClient.setQueryData(key, [{ id: 21, status: 'ACTIVE' }])
  const options = optimisticRowOptions(query, (id) => ({ id, patch: { status: 'ARCHIVED' } }), async () => { throw new Error('Forbidden') })
  try {
    const context = await options.onMutate(21)
    assert.equal(queryClient.getQueryData(key)[0].status, 'ARCHIVED')
    await assert.rejects(options.mutationFn(21), /Forbidden/)
    options.onError(new Error('Forbidden'), 21, context)
    assert.equal(queryClient.getQueryData(key)[0].status, 'ACTIVE')
  } finally { queryClient.clear() }
})

test('logout blocks late optimistic rollback and prevents old actions running as another account', async () => {
  const version = getSessionVersion()
  const key = resourceKey('teacher:7', 'teacherClasses')
  const query = { queryKey: key, setData: (value) => setSessionQueryData(key, value, version) }
  let calls = 0
  queryClient.setQueryData(key, [{ id: 21, status: 'ACTIVE' }])
  const options = optimisticRowOptions(query, (id) => ({ id, patch: { status: 'ARCHIVED' } }), () => { calls += 1 })
  const context = await options.onMutate(21)
  resetQuerySession()
  options.onError(new Error('Late failure'), 21, context)
  assert.equal(queryClient.getQueryData(key), undefined)
  assert.throws(() => options.mutationFn(21), /Account session changed/)
  assert.equal(calls, 0)
})

test('profile and avatar writes revalidate the server profile; class writes do not', () => {
  assert.ok(mutationResources('/users/me', 'put').includes('profile'))
  assert.ok(mutationResources('/users/me/avatar', 'delete').includes('profile'))
  assert.equal(mutationResources('/classes/21', 'put').includes('profile'), false)
})
