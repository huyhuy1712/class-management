import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Pencil, Send, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import defaultAvatar from '../../../assets/images/avatar_default.png'
import FrogLoading from '../../../utils/FrogLoading'
import ConfirmModal from '../../../pages/teacher/classroom/modals/ConfirmModal'
import ClassFeedComments from './ClassFeedComments'
import FeedEmojiPicker from './FeedEmojiPicker'
import useAuthStore from '../../../stores/authStore'
import useResourceQuery from '../../../query/useResourceQuery'
import { getSessionVersion } from '../../../query/queryClient'
import classroomService from '../../../services/classroomService'
import { optimisticEmojiReactions } from '../../../utils/feedReactions'

const PAGE_SIZE = 20

function UserAvatar({ name, avatar, className }) {
  return (
    <img
      src={avatar && avatar !== 'avatar' ? avatar : defaultAvatar}
      alt={`${name} - ảnh đại diện`}
      onError={(event) => {
        event.currentTarget.onerror = null
        event.currentTarget.src = defaultAvatar
      }}
      className={className}
    />
  )
}

function formatPostTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const dateKey = date.toLocaleDateString('sv-SE')
  const todayKey = today.toLocaleDateString('sv-SE')
  const yesterdayKey = yesterday.toLocaleDateString('sv-SE')
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (dateKey === todayKey) return `Hôm nay, ${time}`
  if (dateKey === yesterdayKey) return `Hôm qua, ${time}`
  return `${date.toLocaleDateString('vi-VN')} · ${time}`
}

function updateCachedFeed(queryClient, queryKeyPrefix, updater) {
  queryClient.getQueriesData({ queryKey: queryKeyPrefix }).forEach(([queryKey, data]) => {
    if (data !== undefined) queryClient.setQueryData(queryKey, updater(data, queryKey))
  })
}

function ClassAnnouncementsFeed() {
  const { classId } = useParams()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const currentName = user?.fullName || user?.username || 'Bạn'
  const isTeacher = user?.role === 'TEACHER'
  const [page, setPage] = useState(0)
  const [postDraft, setPostDraft] = useState('')
  const [editingPostId, setEditingPostId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [expandedPostId, setExpandedPostId] = useState(null)
  const [postToDelete, setPostToDelete] = useState(null)
  const postsQuery = useResourceQuery('classFeedPosts', [classId, page, PAGE_SIZE], {
    enabled: Boolean(classId),
    placeholderData: (previousData) => previousData,
  })
  const queryKeyPrefix = ['account', postsQuery.queryKey[1], 'classFeedPosts', String(classId)]

  const createMutation = useMutation({
    mutationFn: (content) => classroomService.createFeedPost(classId, content),
    onMutate: async (content) => {
      const sessionVersion = getSessionVersion()
      await queryClient.cancelQueries({ queryKey: queryKeyPrefix })
      if (sessionVersion !== getSessionVersion()) return { sessionVersion, previousQueries: [] }
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeyPrefix })
      const optimisticId = `optimistic-${Date.now()}`
      const now = new Date().toISOString()
      const optimisticPost = {
        id: optimisticId,
        classId: Number(classId),
        authorId: user?.id,
        authorName: currentName,
        authorAvatar: user?.avatar,
        authorRole: user?.role,
        content,
        createdAt: now,
        updatedAt: now,
        commentCount: 0,
      }

      updateCachedFeed(queryClient, queryKeyPrefix, (data, queryKey) => {
        if (!data) return data
        const totalElements = data.totalElements + 1
        const isFirstPage = Number(queryKey[4]) === 0
        return {
          ...data,
          items: isFirstPage ? [optimisticPost, ...data.items].slice(0, data.size) : data.items,
          totalElements,
          totalPages: Math.ceil(totalElements / data.size),
        }
      })

      return { optimisticId, previousQueries, sessionVersion }
    },
    onError: (_error, _content, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      context?.previousQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    onSuccess: (createdPost, _content, context) => {
      updateCachedFeed(queryClient, queryKeyPrefix, (data) => {
        if (!data) return data
        return {
          ...data,
          items: data.items.map((post) => post.id === context?.optimisticId ? createdPost : post),
        }
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ postId, content }) => classroomService.updateFeedPost(classId, postId, content),
    onMutate: async ({ postId, content }) => {
      const sessionVersion = getSessionVersion()
      await queryClient.cancelQueries({ queryKey: queryKeyPrefix })
      if (sessionVersion !== getSessionVersion()) return { sessionVersion, previousQueries: [] }
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeyPrefix })
      updateCachedFeed(queryClient, queryKeyPrefix, (data) => {
        if (!data) return data
        return {
          ...data,
          items: data.items.map((post) => String(post.id) === String(postId)
            ? { ...post, content, updatedAt: new Date().toISOString() }
            : post),
        }
      })
      return { previousQueries, sessionVersion }
    },
    onError: (_error, _variables, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      context?.previousQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    onSuccess: (updatedPost) => {
      updateCachedFeed(queryClient, queryKeyPrefix, (data) => {
        if (!data) return data
        return {
          ...data,
          items: data.items.map((post) => String(post.id) === String(updatedPost.id) ? updatedPost : post),
        }
      })
      setEditingPostId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (postId) => classroomService.deleteFeedPost(classId, postId),
    onMutate: async (postId) => {
      const sessionVersion = getSessionVersion()
      await queryClient.cancelQueries({ queryKey: queryKeyPrefix })
      if (sessionVersion !== getSessionVersion()) return { sessionVersion, previousQueries: [] }

      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeyPrefix })
      updateCachedFeed(queryClient, queryKeyPrefix, (data) => {
        const totalElements = Math.max(0, data.totalElements - 1)
        return {
          ...data,
          items: data.items.filter((post) => String(post.id) !== String(postId)),
          totalElements,
          totalPages: Math.ceil(totalElements / data.size),
        }
      })
      return { sessionVersion, previousQueries }
    },
    onError: (_error, _postId, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      context?.previousQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    onSuccess: async (_data, postId, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      setPostToDelete(null)
      if (String(editingPostId) === String(postId)) setEditingPostId(null)
      if (String(expandedPostId) === String(postId)) setExpandedPostId(null)
      const updatedFeed = queryClient.getQueryData(postsQuery.queryKey)
      if (page > 0 && page >= (updatedFeed?.totalPages ?? 0)) {
        setPage(Math.max(0, (updatedFeed?.totalPages ?? 0) - 1))
      }
      await queryClient.invalidateQueries({ queryKey: queryKeyPrefix, refetchType: 'active' })
    },
  })

  const voteMutation = useMutation({
    mutationFn: ({ postId, vote, previousVote }) => previousVote === vote
      ? classroomService.clearFeedPostVote(classId, postId)
      : classroomService.setFeedPostVote(classId, postId, vote),
    onMutate: async ({ postId, vote }) => {
      const sessionVersion = getSessionVersion()
      await queryClient.cancelQueries({ queryKey: queryKeyPrefix })
      if (sessionVersion !== getSessionVersion()) return { sessionVersion, previousQueries: [] }

      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeyPrefix })
      updateCachedFeed(queryClient, queryKeyPrefix, (data) => {
        if (!data) return data
        return {
          ...data,
          items: data.items.map((post) => {
            if (String(post.id) !== String(postId)) return post
            const previousVote = post.myVote ?? null
            const nextVote = previousVote === vote ? null : vote
            return {
              ...post,
              likeCount: Math.max(0, Number(post.likeCount ?? 0)
                + Number(nextVote === 'LIKE') - Number(previousVote === 'LIKE')),
              dislikeCount: Math.max(0, Number(post.dislikeCount ?? 0)
                + Number(nextVote === 'DISLIKE') - Number(previousVote === 'DISLIKE')),
              myVote: nextVote,
            }
          }),
        }
      })
      return { sessionVersion, previousQueries }
    },
    onError: (_error, _variables, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      context?.previousQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    onSuccess: (summary, { postId }, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      updateCachedFeed(queryClient, queryKeyPrefix, (data) => {
        if (!data) return data
        return {
          ...data,
          items: data.items.map((post) => String(post.id) === String(postId)
            ? { ...post, ...summary }
            : post),
        }
      })
    },
  })

  const emojiMutation = useMutation({
    mutationFn: ({ postId, emojiCode, previousEmoji }) => previousEmoji === emojiCode
      ? classroomService.clearFeedPostEmoji(classId, postId)
      : classroomService.setFeedPostEmoji(classId, postId, emojiCode),
    onMutate: async ({ postId, emojiCode, previousEmoji }) => {
      const sessionVersion = getSessionVersion()
      await queryClient.cancelQueries({ queryKey: queryKeyPrefix })
      if (sessionVersion !== getSessionVersion()) return { sessionVersion, previousQueries: [] }

      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeyPrefix })
      const nextEmoji = previousEmoji === emojiCode ? null : emojiCode
      updateCachedFeed(queryClient, queryKeyPrefix, (data) => ({
        ...data,
        items: data.items.map((post) => String(post.id) === String(postId)
          ? { ...post, emojiReactions: optimisticEmojiReactions(post.emojiReactions, previousEmoji, nextEmoji) }
          : post),
      }))
      return { sessionVersion, previousQueries }
    },
    onError: (_error, _variables, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      context?.previousQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    onSuccess: (emojiReactions, { postId }, context) => {
      if (context?.sessionVersion !== getSessionVersion()) return
      updateCachedFeed(queryClient, queryKeyPrefix, (data) => ({
        ...data,
        items: data.items.map((post) => String(post.id) === String(postId)
          ? { ...post, emojiReactions }
          : post),
      }))
    },
  })

  const publishPost = (event) => {
    event.preventDefault()
    const content = postDraft.trim()
    if (!content || createMutation.isPending) return
    createMutation.mutate(content, {
      onSuccess: () => setPostDraft((current) => current === content ? '' : current),
    })
  }

  const saveEditedPost = (event, postId) => {
    event.preventDefault()
    const content = editDraft.trim()
    if (!content || updateMutation.isPending) return
    updateMutation.mutate({ postId, content })
  }

  const confirmDeletePost = () => {
    if (postToDelete && !deleteMutation.isPending) deleteMutation.mutate(postToDelete.id)
  }

  const startEditing = (post) => {
    updateMutation.reset()
    setEditingPostId(post.id)
    setEditDraft(post.content)
  }

  const queryError = postsQuery.error?.response?.data?.message
    || postsQuery.error?.message
    || 'Không thể tải bài đăng. Vui lòng thử lại.'
  const createError = createMutation.error?.response?.data?.message
    || (createMutation.isError ? 'Không thể đăng bài. Vui lòng thử lại.' : '')
  const updateError = updateMutation.error?.response?.data?.message
    || (updateMutation.isError ? 'Không thể cập nhật bài đăng. Vui lòng thử lại.' : '')
  const deleteError = deleteMutation.error?.response?.data?.message
    || (deleteMutation.isError ? 'Không thể xóa bài đăng. Vui lòng thử lại.' : '')
  const posts = postsQuery.data?.items ?? []
  const totalPages = postsQuery.data?.totalPages ?? 0

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#18301D] sm:text-2xl">Bảng tin lớp học</h2>
        <p className="mt-1 text-sm text-slate-500">Cùng chia sẻ thông báo và trao đổi với mọi người trong lớp.</p>
        {postsQuery.isFetching && postsQuery.data && (
          <FrogLoading compact label="Đang đồng bộ bài đăng..." className="mt-2 text-xs text-slate-400" />
        )}
        {postsQuery.isError && postsQuery.data && (
          <p role="alert" className="mt-2 text-xs text-rose-600">{queryError}</p>
        )}
      </header>

      <form onSubmit={publishPost} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <UserAvatar name={currentName} avatar={user?.avatar} className="h-11 w-11 shrink-0 rounded-full object-cover" />
          <label className="min-w-0 flex-1">
            <span className="sr-only">Nội dung bài đăng</span>
            <textarea
              value={postDraft}
              onChange={(event) => setPostDraft(event.target.value)}
              rows={3}
              maxLength={20000}
              placeholder={isTeacher ? 'Chia sẻ thông báo với lớp...' : 'Bạn muốn chia sẻ điều gì với lớp?'}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            />
          </label>
        </div>
        {createError && <p role="alert" className="ml-14 mt-2 text-sm text-rose-600">{createError}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={!postDraft.trim() || createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Send size={16} />
            {createMutation.isPending ? <FrogLoading compact label="Đang đăng..." /> : 'Đăng bài'}
          </button>
        </div>
      </form>

      {postsQuery.isPending ? (
        <FrogLoading label="Đang tải bảng tin..." className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm" />
      ) : postsQuery.isError && !postsQuery.data ? (
        <div role="alert" className="rounded-2xl border border-rose-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-rose-600">{queryError}</p>
          <button type="button" onClick={() => postsQuery.refetch()} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Thử tải lại
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
          <MessageCircle size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">Chưa có bài đăng nào</p>
          <p className="mt-1 text-sm text-slate-500">Hãy là người đầu tiên chia sẻ với lớp.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isAuthor = String(post.authorId) === String(user?.id)
            const isEditing = String(editingPostId) === String(post.id)
            return (
              <article key={post.id} className="overflow-visible rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar name={post.authorName} avatar={post.authorAvatar} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{post.authorName}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {post.authorRole === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                          <span className="px-1">·</span>
                          {formatPostTime(post.createdAt)}
                          {post.updatedAt !== post.createdAt && <span className="ml-1">(đã chỉnh sửa)</span>}
                        </p>
                      </div>
                    </div>
                    {isAuthor && !isEditing && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => startEditing(post)} aria-label="Sửa bài viết" title="Sửa bài viết" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          aria-label="Xóa bài viết"
                          title="Xóa bài viết"
                          disabled={deleteMutation.isPending}
                          onClick={() => { deleteMutation.reset(); setPostToDelete(post) }}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          {deleteMutation.isPending && String(deleteMutation.variables) === String(post.id)
                            ? <FrogLoading compact label="" />
                            : <Trash2 size={17} />}
                        </button>
                      </div>
                    )}
                  </div>
                  {deleteError && String(deleteMutation.variables) === String(post.id) && (
                    <p role="alert" className="mt-2 text-sm text-rose-600">{deleteError}</p>
                  )}

                  {isEditing ? (
                    <form onSubmit={(event) => saveEditedPost(event, post.id)} className="mt-4">
                      <label>
                        <span className="sr-only">Chỉnh sửa nội dung bài đăng</span>
                        <textarea
                          autoFocus
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                          rows={3}
                          maxLength={20000}
                          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                        />
                      </label>
                      {updateError && <p role="alert" className="mt-2 text-sm text-rose-600">{updateError}</p>}
                      <div className="mt-3 flex justify-end gap-2">
                        <button type="button" onClick={() => { setEditingPostId(null); updateMutation.reset() }} disabled={updateMutation.isPending} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">
                          Hủy
                        </button>
                        <button type="submit" disabled={!editDraft.trim() || updateMutation.isPending} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                          {updateMutation.isPending ? <FrogLoading compact label="Đang lưu..." /> : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.content}</p>
                  )}

                  {!isEditing && (
                    <>
                      <div className="mt-4 flex flex-wrap items-center gap-1 border-y border-slate-100 py-2">
                        <button
                          type="button"
                          aria-pressed={post.myVote === 'LIKE'}
                          disabled={voteMutation.isPending}
                          onClick={() => {
                            voteMutation.reset()
                            voteMutation.mutate({ postId: post.id, vote: 'LIKE', previousVote: post.myVote ?? null })
                          }}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${post.myVote === 'LIKE' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        >
                          <ThumbsUp size={17} /> Thích <span>{post.likeCount ?? 0}</span>
                        </button>
                        <button
                          type="button"
                          aria-pressed={post.myVote === 'DISLIKE'}
                          disabled={voteMutation.isPending}
                          onClick={() => {
                            voteMutation.reset()
                            voteMutation.mutate({ postId: post.id, vote: 'DISLIKE', previousVote: post.myVote ?? null })
                          }}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${post.myVote === 'DISLIKE' ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-700'}`}
                        >
                          <ThumbsDown size={17} /> Không thích <span>{post.dislikeCount ?? 0}</span>
                        </button>
                        <FeedEmojiPicker
                          reactions={post.emojiReactions}
                          disabled={emojiMutation.isPending}
                          onSelect={(emojiCode) => {
                            emojiMutation.reset()
                            emojiMutation.mutate({
                              postId: post.id,
                              emojiCode,
                              previousEmoji: post.emojiReactions?.find((reaction) => reaction.reactedByMe)?.emojiCode ?? null,
                            })
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedPostId((current) => String(current) === String(post.id) ? null : post.id)}
                          aria-expanded={String(expandedPostId) === String(post.id)}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <MessageCircle size={16} /> Bình luận <span>{post.commentCount ?? 0}</span>
                        </button>
                      </div>
                      {voteMutation.isError && String(voteMutation.variables?.postId) === String(post.id) && (
                        <p role="alert" className="mt-2 text-xs text-rose-600">
                          {voteMutation.error?.response?.data?.message || 'Không thể cập nhật lượt thích. Vui lòng thử lại.'}
                        </p>
                      )}
                      {emojiMutation.isError && String(emojiMutation.variables?.postId) === String(post.id) && (
                        <p role="alert" className="mt-2 text-xs text-rose-600">
                          {emojiMutation.error?.response?.data?.message || 'Không thể cập nhật cảm xúc. Vui lòng thử lại.'}
                        </p>
                      )}

                      {String(expandedPostId) === String(post.id) && (
                        <ClassFeedComments
                          classId={classId}
                          post={post}
                          user={user}
                          feedQueryKeyPrefix={queryKeyPrefix}
                        />
                      )}
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
          <button type="button" disabled={page === 0 || postsQuery.isFetching} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-300">
            Bài mới hơn
          </button>
          <span className="text-sm text-slate-500">
            {postsQuery.isPlaceholderData
              ? <FrogLoading compact label="Đang tải trang..." />
              : `Trang ${page + 1} / ${totalPages}`}
          </span>
          <button type="button" disabled={page + 1 >= totalPages || postsQuery.isFetching} onClick={() => setPage((current) => current + 1)} className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-300">
            Bài cũ hơn
          </button>
        </div>
      )}
      <ConfirmModal
        open={Boolean(postToDelete)}
        title="Xóa bài viết"
        description="Bài viết và các bình luận thuộc bài viết sẽ không còn hiển thị. Bạn có chắc muốn tiếp tục?"
        confirmText="Xóa bài viết"
        danger
        loading={deleteMutation.isPending}
        error={deleteError}
        onClose={() => {
          if (!deleteMutation.isPending) setPostToDelete(null)
        }}
        onConfirm={confirmDeletePost}
      />
    </section>
  )
}

export default ClassAnnouncementsFeed
