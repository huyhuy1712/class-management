import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Send, Trash2 } from 'lucide-react'
import defaultAvatar from '../../../assets/images/avatar_default.png'
import FrogLoading from '../../../utils/FrogLoading'
import ConfirmModal from '../../../pages/teacher/classroom/modals/ConfirmModal'
import useResourceQuery from '../../../query/useResourceQuery'
import { getSessionVersion } from '../../../query/queryClient'
import classroomService from '../../../services/classroomService'
import FeedEmojiPicker from './FeedEmojiPicker'
import { optimisticEmojiReactions } from '../../../utils/feedReactions'

const PAGE_SIZE = 20

function updateCachedQueries(queryClient, queryKeyPrefix, updater) {
  queryClient.getQueriesData({ queryKey: queryKeyPrefix }).forEach(([queryKey, data]) => {
    if (data !== undefined) queryClient.setQueryData(queryKey, updater(data, queryKey))
  })
}

function updatePostCommentCount(queryClient, feedQueryKeyPrefix, postId, delta) {
  updateCachedQueries(queryClient, feedQueryKeyPrefix, (data) => ({
    ...data,
    items: data.items.map((post) => String(post.id) === String(postId)
      ? { ...post, commentCount: Math.max(0, Number(post.commentCount ?? 0) + delta) }
      : post),
  }))
}

function CommentAvatar({ name, avatar }) {
  return (
    <img
      src={avatar && avatar !== 'avatar' ? avatar : defaultAvatar}
      alt={`${name} - ảnh đại diện`}
      onError={(event) => {
        event.currentTarget.onerror = null
        event.currentTarget.src = defaultAvatar
      }}
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  )
}

export default function ClassFeedComments({ classId, post, user, feedQueryKeyPrefix }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [commentToDelete, setCommentToDelete] = useState(null)
  const query = useResourceQuery('classFeedComments', [classId, post.id, page, PAGE_SIZE])
  const commentsQueryKeyPrefix = query.queryKey.slice(0, 5)

  const createMutation = useMutation({
    mutationFn: (content) => classroomService.createFeedComment(classId, post.id, content),
    onMutate: async (content) => {
      const sessionVersion = getSessionVersion()
      await Promise.all([
        queryClient.cancelQueries({ queryKey: commentsQueryKeyPrefix }),
        queryClient.cancelQueries({ queryKey: feedQueryKeyPrefix }),
      ])
      if (sessionVersion !== getSessionVersion()) return { sessionVersion, comments: [], feed: [] }

      const comments = queryClient.getQueriesData({ queryKey: commentsQueryKeyPrefix })
      const feed = queryClient.getQueriesData({ queryKey: feedQueryKeyPrefix })
      const optimisticId = `optimistic-comment-${Date.now()}`
      const now = new Date().toISOString()
      const optimisticComment = {
        id: optimisticId,
        postId: post.id,
        parentCommentId: null,
        authorId: user?.id,
        authorName: user?.fullName || user?.username || 'Bạn',
        authorAvatar: user?.avatar,
        authorRole: user?.role,
        content,
        createdAt: now,
        updatedAt: now,
      }

      const firstPageKey = [...commentsQueryKeyPrefix, '0', String(PAGE_SIZE)]
      const firstPage = queryClient.getQueryData(firstPageKey)
      if (firstPage) {
        queryClient.setQueryData(firstPageKey, {
          ...firstPage,
          items: [optimisticComment, ...firstPage.items].slice(0, firstPage.size),
          totalElements: firstPage.totalElements + 1,
          totalPages: Math.ceil((firstPage.totalElements + 1) / firstPage.size),
        })
      } else {
        queryClient.setQueryData(firstPageKey, {
          items: [optimisticComment],
          page: 0,
          size: PAGE_SIZE,
          totalElements: 1,
          totalPages: 1,
        })
      }
      updatePostCommentCount(queryClient, feedQueryKeyPrefix, post.id, 1)

      return { sessionVersion, comments, feed, optimisticId }
    },
    onError: (_error, _content, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      context?.comments.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
      context?.feed.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    onSuccess: (createdComment, content, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      updateCachedQueries(queryClient, commentsQueryKeyPrefix, (data) => ({
        ...data,
        items: data.items.map((comment) => comment.id === context.optimisticId ? createdComment : comment),
      }))
      setDraft((current) => current === content ? '' : current)
      setPage(0)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }) => (
      classroomService.updateFeedComment(classId, post.id, commentId, content)
    ),
    onMutate: async ({ commentId, content }) => {
      const sessionVersion = getSessionVersion()
      await queryClient.cancelQueries({ queryKey: commentsQueryKeyPrefix })
      if (sessionVersion !== getSessionVersion()) return { sessionVersion, previousComments: [] }

      const previousComments = queryClient.getQueriesData({ queryKey: commentsQueryKeyPrefix })
      updateCachedQueries(queryClient, commentsQueryKeyPrefix, (data) => ({
        ...data,
        items: data.items.map((comment) => String(comment.id) === String(commentId)
          ? { ...comment, content, updatedAt: new Date().toISOString() }
          : comment),
      }))
      return { sessionVersion, previousComments }
    },
    onError: (_error, _variables, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      context?.previousComments.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    onSuccess: (updatedComment, _variables, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      updateCachedQueries(queryClient, commentsQueryKeyPrefix, (data) => ({
        ...data,
        items: data.items.map((comment) => String(comment.id) === String(updatedComment.id)
          ? updatedComment
          : comment),
      }))
      setEditingCommentId(null)
      setEditDraft('')
    },
  })

  const emojiMutation = useMutation({
    mutationFn: ({ commentId, emojiCode, previousEmoji }) => previousEmoji === emojiCode
      ? classroomService.clearFeedCommentEmoji(classId, post.id, commentId)
      : classroomService.setFeedCommentEmoji(classId, post.id, commentId, emojiCode),
    onMutate: async ({ commentId, emojiCode, previousEmoji }) => {
      const sessionVersion = getSessionVersion()
      await queryClient.cancelQueries({ queryKey: commentsQueryKeyPrefix })
      if (sessionVersion !== getSessionVersion()) return { sessionVersion, previousComments: [] }

      const previousComments = queryClient.getQueriesData({ queryKey: commentsQueryKeyPrefix })
      const nextEmoji = previousEmoji === emojiCode ? null : emojiCode
      updateCachedQueries(queryClient, commentsQueryKeyPrefix, (data) => ({
        ...data,
        items: data.items.map((comment) => String(comment.id) === String(commentId)
          ? { ...comment, emojiReactions: optimisticEmojiReactions(comment.emojiReactions, previousEmoji, nextEmoji) }
          : comment),
      }))
      return { sessionVersion, previousComments }
    },
    onError: (_error, _variables, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      context?.previousComments.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    onSuccess: (emojiReactions, { commentId }, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      updateCachedQueries(queryClient, commentsQueryKeyPrefix, (data) => ({
        ...data,
        items: data.items.map((comment) => String(comment.id) === String(commentId)
          ? { ...comment, emojiReactions }
          : comment),
      }))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId) => classroomService.deleteFeedComment(classId, post.id, commentId),
    onMutate: async (commentId) => {
      const sessionVersion = getSessionVersion()
      await Promise.all([
        queryClient.cancelQueries({ queryKey: commentsQueryKeyPrefix }),
        queryClient.cancelQueries({ queryKey: feedQueryKeyPrefix }),
      ])
      if (sessionVersion !== getSessionVersion()) return { sessionVersion, comments: [], feed: [] }

      const comments = queryClient.getQueriesData({ queryKey: commentsQueryKeyPrefix })
      const feed = queryClient.getQueriesData({ queryKey: feedQueryKeyPrefix })
      updateCachedQueries(queryClient, commentsQueryKeyPrefix, (data) => {
        const totalElements = Math.max(0, data.totalElements - 1)
        return {
          ...data,
          items: data.items.filter((comment) => String(comment.id) !== String(commentId)),
          totalElements,
          totalPages: Math.ceil(totalElements / data.size),
        }
      })
      updatePostCommentCount(queryClient, feedQueryKeyPrefix, post.id, -1)
      return { sessionVersion, comments, feed }
    },
    onError: (_error, _commentId, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      context?.comments.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
      context?.feed.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    onSuccess: async (_data, _commentId, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      setCommentToDelete(null)
      const updatedComments = queryClient.getQueryData(query.queryKey)
      if (page > 0 && page >= (updatedComments?.totalPages ?? 0)) {
        setPage(Math.max(0, (updatedComments?.totalPages ?? 0) - 1))
      }
      await queryClient.invalidateQueries({ queryKey: commentsQueryKeyPrefix, refetchType: 'active' })
    },
  })

  const submitComment = (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || createMutation.isPending) return
    createMutation.mutate(content)
  }

  const confirmDeleteComment = () => {
    if (commentToDelete && !deleteMutation.isPending) deleteMutation.mutate(commentToDelete.id)
  }

  const startEditingComment = (comment) => {
    updateMutation.reset()
    setEditingCommentId(comment.id)
    setEditDraft(comment.content)
  }

  const submitEditedComment = (event, commentId) => {
    event.preventDefault()
    const content = editDraft.trim()
    if (!content || updateMutation.isPending) return
    updateMutation.mutate({ commentId, content })
  }

  const cancelEditingComment = () => {
    if (updateMutation.isPending) return
    setEditingCommentId(null)
    setEditDraft('')
    updateMutation.reset()
  }

  const comments = query.data?.items ?? []
  const totalPages = query.data?.totalPages ?? 0
  const errorMessage = query.error?.response?.data?.message
    || query.error?.message
    || 'Không thể tải bình luận. Vui lòng thử lại.'
  const createError = createMutation.error?.response?.data?.message
    || (createMutation.isError ? 'Không thể gửi bình luận. Vui lòng thử lại.' : '')
  const deleteError = deleteMutation.error?.response?.data?.message
    || (deleteMutation.isError ? 'Không thể xóa bình luận. Vui lòng thử lại.' : '')
  const updateError = updateMutation.error?.response?.data?.message
    || (updateMutation.isError ? 'Không thể cập nhật bình luận. Vui lòng thử lại.' : '')

  return (
    <div className="space-y-4 pt-4">
      {query.isPending ? (
        <FrogLoading compact label="Đang tải bình luận..." />
      ) : query.isError && !query.data ? (
        <div role="alert" className="text-sm text-rose-600">
          <p>{errorMessage}</p>
          <button type="button" onClick={() => query.refetch()} className="mt-1 font-semibold text-emerald-700">Thử tải lại</button>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400">Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isEditingComment = String(editingCommentId) === String(comment.id)
            return (
            <div key={comment.id} className="flex items-start gap-2.5">
              <CommentAvatar name={comment.authorName} avatar={comment.authorAvatar} />
              <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3.5 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-700">{comment.authorName}</p>
                    <p className="text-xs text-slate-400">{comment.authorRole === 'TEACHER' ? 'Giáo viên' : 'Học sinh'} · {new Date(comment.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  {String(comment.authorId) === String(user?.id) && !isEditingComment && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="Sửa bình luận"
                        title="Sửa bình luận"
                        disabled={updateMutation.isPending || deleteMutation.isPending}
                        onClick={() => startEditingComment(comment)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Xóa bình luận"
                        title="Xóa bình luận"
                        disabled={deleteMutation.isPending || updateMutation.isPending}
                        onClick={() => { deleteMutation.reset(); setCommentToDelete(comment) }}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        {deleteMutation.isPending && String(deleteMutation.variables) === String(comment.id)
                          ? <FrogLoading compact label="Đang xóa..." />
                          : <Trash2 size={15} />}
                      </button>
                    </div>
                  )}
                </div>
                {isEditingComment ? (
                  <form onSubmit={(event) => submitEditedComment(event, comment.id)} className="mt-2">
                    <label>
                      <span className="sr-only">Chỉnh sửa bình luận</span>
                      <textarea
                        autoFocus
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value)}
                        maxLength={10000}
                        rows={2}
                        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                      />
                    </label>
                    {updateError && String(updateMutation.variables?.commentId) === String(comment.id) && (
                      <p role="alert" className="mt-1 text-xs text-rose-600">{updateError}</p>
                    )}
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" onClick={cancelEditingComment} disabled={updateMutation.isPending} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                        Hủy
                      </button>
                      <button type="submit" disabled={!editDraft.trim() || updateMutation.isPending} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                        {updateMutation.isPending ? <FrogLoading compact label="Đang lưu..." /> : 'Lưu'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {comment.content}
                    {comment.updatedAt !== comment.createdAt && <span className="ml-1 text-xs text-slate-400">(đã chỉnh sửa)</span>}
                  </p>
                )}
                {!isEditingComment && (
                  <div className="mt-2 flex items-center gap-2">
                    <FeedEmojiPicker
                      reactions={comment.emojiReactions}
                      disabled={emojiMutation.isPending}
                      label="Thêm cảm xúc cho bình luận"
                      onSelect={(emojiCode) => {
                        emojiMutation.reset()
                        emojiMutation.mutate({
                          commentId: comment.id,
                          emojiCode,
                          previousEmoji: comment.emojiReactions?.find((reaction) => reaction.reactedByMe)?.emojiCode ?? null,
                        })
                      }}
                    />
                    {emojiMutation.isError && String(emojiMutation.variables?.commentId) === String(comment.id) && (
                      <p role="alert" className="text-xs text-rose-600">
                        {emojiMutation.error?.response?.data?.message || 'Không thể cập nhật cảm xúc. Vui lòng thử lại.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <button type="button" disabled={page === 0 || query.isFetching} onClick={() => setPage((current) => Math.max(0, current - 1))} className="font-semibold text-emerald-700 disabled:text-slate-300">Bình luận mới hơn</button>
          <span>{page + 1} / {totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages || query.isFetching} onClick={() => setPage((current) => current + 1)} className="font-semibold text-emerald-700 disabled:text-slate-300">Bình luận cũ hơn</button>
        </div>
      )}

      <form className="flex items-start gap-2.5" onSubmit={submitComment}>
        <CommentAvatar name={user?.fullName || user?.username || 'Bạn'} avatar={user?.avatar} />
        <div className="min-w-0 flex-1">
          <p className="mb-1 truncate text-xs font-semibold text-slate-600">{user?.fullName || user?.username || 'Bạn'}</p>
          <label className="flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-4 pr-1 focus-within:border-emerald-300">
            <span className="sr-only">Viết bình luận</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={10000}
              placeholder="Viết bình luận..."
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button type="submit" disabled={!draft.trim() || createMutation.isPending} aria-label="Gửi bình luận" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {createMutation.isPending ? <FrogLoading compact label="" /> : <Send size={14} />}
            </button>
          </label>
          {createError && <p role="alert" className="mt-1 text-xs text-rose-600">{createError}</p>}
        </div>
      </form>
      <ConfirmModal
        open={Boolean(commentToDelete)}
        title="Xóa bình luận"
        description="Bình luận này sẽ bị ẩn khỏi bài viết. Bạn có chắc muốn tiếp tục?"
        confirmText="Xóa bình luận"
        danger
        loading={deleteMutation.isPending}
        error={deleteError}
        onClose={() => {
          if (!deleteMutation.isPending) setCommentToDelete(null)
        }}
        onConfirm={confirmDeleteComment}
      />
    </div>
  )
}
