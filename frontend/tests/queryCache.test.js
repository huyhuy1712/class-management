import test from 'node:test'
import assert from 'node:assert/strict'
import { QueryObserver } from '@tanstack/react-query'
import { queryClient, getSessionVersion, resetQuerySession, setSessionQueryData } from '../src/query/queryClient.js'
import { accountScope, resourceKey } from '../src/query/queryKeys.js'
import { mutationResources, isAffectedQuery } from '../src/query/mutationResources.js'
import { applyNotificationAction, restoreNotifications } from '../src/query/notificationUpdates.js'

// Retained detached queries must not keep the Node test runner alive with GC timers.
queryClient.setDefaultOptions({ ...queryClient.getDefaultOptions(), queries: { ...queryClient.getDefaultOptions().queries, gcTime: Infinity } })

test('same resource shares an in-flight request and reuses fresh cache', async () => {
  const key = resourceKey('teacher:1', 'teacherClasses')
  let calls = 0
  const options = { queryKey: key, queryFn: async () => { calls += 1; return [{ id: 21 }] } }
  try {
    const [first, second] = await Promise.all([queryClient.fetchQuery(options), queryClient.fetchQuery(options)])
    assert.deepEqual(first, second)
    await queryClient.fetchQuery(options)
    assert.equal(calls, 1)
  } finally { queryClient.clear() }
})

test('background refetch retains existing rows without initial loading', async () => {
  const key = resourceKey('student:1', 'studentClasses')
  queryClient.setQueryData(key, [{ id: 21 }])
  let finish
  const observer = new QueryObserver(queryClient, { queryKey: key, queryFn: () => new Promise((resolve) => { finish = resolve }) })
  const unsubscribe = observer.subscribe(() => {})
  try {
    const request = observer.refetch()
    assert.equal(observer.getCurrentResult().isLoading, false)
    assert.equal(observer.getCurrentResult().isFetching, true)
    assert.deepEqual(observer.getCurrentResult().data, [{ id: 21 }])
    finish([{ id: 21 }, { id: 22 }])
    await request
    assert.equal(observer.getCurrentResult().data.length, 2)
  } finally { unsubscribe(); queryClient.clear() }
})

test('cache separates account, role and classroom, and logout blocks old writes', () => {
  const version = getSessionVersion()
  const key = resourceKey(accountScope({ role: 'STUDENT', id: 1 }, version), 'attendances', [21])
  queryClient.setQueryData(key, [{ studentId: 1 }])
  assert.equal(queryClient.getQueryData(resourceKey(accountScope({ role: 'STUDENT', id: 2 }, version), 'attendances', [21])), undefined)
  assert.equal(queryClient.getQueryData(resourceKey(accountScope({ role: 'TEACHER', id: 1 }, version), 'attendances', [21])), undefined)
  assert.equal(queryClient.getQueryData(resourceKey(accountScope({ role: 'STUDENT', id: 1 }, version), 'attendances', [22])), undefined)
  resetQuerySession()
  setSessionQueryData(key, [{ studentId: 1 }], version)
  assert.equal(queryClient.getQueryCache().getAll().length, 0)
})

test('logout cancels pending reads and late results cannot restore cache', async () => {
  let finish
  const key = resourceKey('student:1', 'studentClasses')
  const pending = queryClient.fetchQuery({ queryKey: key, queryFn: ({ signal }) => {
    assert.equal(signal.aborted, false)
    return new Promise((resolve) => { finish = resolve })
  } }).catch(() => undefined)
  resetQuerySession()
  finish([{ id: 21 }])
  await pending
  assert.equal(queryClient.getQueryCache().getAll().length, 0)
})

test('writes invalidate only relevant resources and matching classroom/exam', () => {
  assert.deepEqual(mutationResources('/classes/21/lessons', 'post'), ['lessons'])
  assert.deepEqual(mutationResources('/classes/21/feed/posts', 'post'), ['classFeedPosts'])
  assert.equal(isAffectedQuery(resourceKey('a', 'classFeedPosts', [21, 0, 20]), '/classes/21/feed/posts', 'post'), true)
  assert.equal(isAffectedQuery(resourceKey('a', 'classFeedPosts', [22, 0, 20]), '/classes/21/feed/posts', 'post'), false)
  assert.deepEqual(mutationResources('/classes/21/lessons', 'get'), [])
  assert.equal(isAffectedQuery(resourceKey('a', 'attendances', [21]), '/classes/21/attendances', 'post'), true)
  assert.equal(isAffectedQuery(resourceKey('a', 'attendances', [22]), '/classes/21/attendances', 'post'), false)
  assert.ok(mutationResources('/classes/21/students/5', 'delete').includes('classExams'))
  assert.ok(mutationResources('/classes/21/students/5', 'delete').includes('studentGrades'))
  assert.ok(mutationResources('/classes/21/students/5', 'delete').includes('teacherMaterials'))
  assert.ok(mutationResources('/classes/21/students', 'delete').includes('teacherMaterials'))
  assert.equal(mutationResources('/classes/21/attendances', 'post').includes('teacherMaterials'), false)
  assert.equal(isAffectedQuery(resourceKey('a', 'teacherMaterials'), '/classes/21/students/5', 'delete'), true)
  assert.equal(isAffectedQuery(resourceKey('a', 'exams'), '/classes/21/attendances', 'post'), false)
  assert.equal(isAffectedQuery(resourceKey('a', 'examConfiguration', [7]), '/exams/7', 'put'), true)
  assert.equal(isAffectedQuery(resourceKey('a', 'examConfiguration', [8]), '/exams/7', 'put'), false)
  assert.equal(isAffectedQuery(resourceKey('a', 'notifications'), '/notifications/1/read', 'patch'), true)
})

test('optimistic notifications are immutable and rollback preserves successful partial deletes', () => {
  const items = [{ id: 1, read: false }, { id: 2, read: false }]
  assert.equal(applyNotificationAction(items, { type: 'read', id: 1 })[0].read, true)
  assert.equal(items[0].read, false)
  assert.deepEqual(applyNotificationAction(items, { type: 'delete', id: 1 }).map((item) => item.id), [2])
  assert.deepEqual(applyNotificationAction(items, { type: 'deleteAll', ids: [1, 2] }), [])
  assert.deepEqual(restoreNotifications(items, [1]).map((item) => item.id), [2])
  assert.deepEqual(restoreNotifications(items), items)
})

test('validation/auth errors and mutations are never automatically retried', () => {
  const defaults = queryClient.getDefaultOptions()
  for (const status of [400, 401, 403, 404, 409, 422]) assert.equal(defaults.queries.retry(0, { response: { status } }), false)
  assert.equal(defaults.queries.retry(0, { response: { status: 503 } }), true)
  assert.equal(defaults.queries.retry(1, { response: { status: 503 } }), false)
  assert.equal(defaults.mutations.retry, false)
})
