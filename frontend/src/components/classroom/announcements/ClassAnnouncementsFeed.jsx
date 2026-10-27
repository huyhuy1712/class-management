import { useState } from 'react'
import { MessageCircle, MoreHorizontal, Send, SmilePlus, ThumbsDown, ThumbsUp } from 'lucide-react'
import useAuthStore from '../../../stores/authStore'

const reactionOptions = ['❤️', '😂', '🎉', '👏']

const initialPosts = [
  {
    id: 1,
    author: 'Cô Nguyễn Minh Anh',
    role: 'Giáo viên',
    initials: 'MA',
    time: 'Hôm nay, 08:30',
    content: 'Chào cả lớp! Cô đã cập nhật tài liệu ôn tập cho bài kiểm tra sắp tới. Các em nhớ xem lại phần bài tập chương 3 nhé. Chúc cả lớp học tốt! 📚',
    likes: 12,
    dislikes: 0,
    reactions: { '❤️': 3, '😂': 0, '🎉': 2, '👏': 1 },
    comments: [
      { id: 1, author: 'Nguyễn Hoàng Nam', initials: 'HN', content: 'Em đã nhận được tài liệu ạ. Em cảm ơn cô!' },
    ],
    likedByMe: false,
    dislikedByMe: false,
    myReaction: null,
  },
  {
    id: 2,
    author: 'Trần Thu Hà',
    role: 'Học sinh',
    initials: 'TH',
    time: 'Hôm qua, 16:15',
    content: 'Mọi người ơi, mình đã tổng hợp ghi chú buổi học hôm nay. Bạn nào cần thì cùng trao đổi ở đây nhé! ✨',
    likes: 5,
    dislikes: 0,
    reactions: { '❤️': 2, '😂': 0, '🎉': 0, '👏': 1 },
    comments: [],
    likedByMe: false,
    dislikedByMe: false,
    myReaction: null,
  },
]

function initialsFor(name) {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi') || 'B'
}

function ClassAnnouncementsFeed() {
  const user = useAuthStore((state) => state.user)
  const currentName = user?.fullName || user?.username || 'Bạn'
  const isTeacher = user?.role === 'TEACHER'
  const [posts, setPosts] = useState(initialPosts)
  const [postDraft, setPostDraft] = useState('')
  const [commentDrafts, setCommentDrafts] = useState({})
  const [openReactions, setOpenReactions] = useState({})

  const updatePost = (postId, update) => {
    setPosts((current) => current.map((post) => post.id === postId ? update(post) : post))
  }

  const publishPost = (event) => {
    event.preventDefault()
    const content = postDraft.trim()
    if (!content) return
    setPosts((current) => [{
      id: Date.now(),
      author: currentName,
      role: isTeacher ? 'Giáo viên' : 'Học sinh',
      initials: initialsFor(currentName),
      time: 'Vừa xong',
      content,
      likes: 0,
      dislikes: 0,
      reactions: Object.fromEntries(reactionOptions.map((reaction) => [reaction, 0])),
      comments: [],
      likedByMe: false,
      dislikedByMe: false,
      myReaction: null,
    }, ...current])
    setPostDraft('')
  }

  const addComment = (event, post) => {
    event.preventDefault()
    const content = (commentDrafts[post.id] ?? '').trim()
    if (!content) return
    updatePost(post.id, (current) => ({
      ...current,
      comments: [...current.comments, {
        id: Date.now(),
        author: currentName,
        initials: initialsFor(currentName),
        content,
      }],
    }))
    setCommentDrafts((current) => ({ ...current, [post.id]: '' }))
  }

  const toggleLike = (post) => updatePost(post.id, (current) => ({
    ...current,
    likes: current.likes + (current.likedByMe ? -1 : 1),
    dislikes: current.dislikes - (current.dislikedByMe ? 1 : 0),
    likedByMe: !current.likedByMe,
    dislikedByMe: false,
  }))

  const toggleDislike = (post) => updatePost(post.id, (current) => ({
    ...current,
    likes: current.likes - (current.likedByMe ? 1 : 0),
    dislikes: current.dislikes + (current.dislikedByMe ? -1 : 1),
    likedByMe: false,
    dislikedByMe: !current.dislikedByMe,
  }))

  const toggleReaction = (post, reaction) => updatePost(post.id, (current) => ({
    ...current,
    reactions: {
      ...current.reactions,
      ...(current.myReaction ? { [current.myReaction]: Math.max(0, current.reactions[current.myReaction] - 1) } : {}),
      [reaction]: current.reactions[reaction] + (current.myReaction === reaction ? -1 : 1),
    },
    myReaction: current.myReaction === reaction ? null : reaction,
  }))

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#18301D] sm:text-2xl">Bảng tin lớp học</h2>
        <p className="mt-1 text-sm text-slate-500">Cùng chia sẻ thông báo và trao đổi với mọi người trong lớp.</p>
      </header>

      <form onSubmit={publishPost} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            {initialsFor(currentName)}
          </div>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Nội dung bài đăng</span>
            <textarea
              value={postDraft}
              onChange={(event) => setPostDraft(event.target.value)}
              rows={3}
              placeholder={isTeacher ? 'Chia sẻ thông báo với lớp...' : 'Bạn muốn chia sẻ điều gì với lớp?'}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={!postDraft.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Send size={16} />
            Đăng bài
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="overflow-visible rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {post.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{post.author}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{post.role} <span className="px-1">·</span> {post.time}</p>
                  </div>
                </div>
                <button type="button" aria-label="Tùy chọn bài viết" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.content}</p>

              {(post.likes > 0 || post.dislikes > 0 || Object.values(post.reactions).some((count) => count > 0)) && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {post.likes > 0 && <span className="rounded-full bg-slate-50 px-2.5 py-1">👍 {post.likes}</span>}
                  {post.dislikes > 0 && <span className="rounded-full bg-slate-50 px-2.5 py-1">👎 {post.dislikes}</span>}
                  {reactionOptions.filter((reaction) => post.reactions[reaction] > 0).map((reaction) => (
                    <span key={reaction} className="rounded-full bg-slate-50 px-2.5 py-1">{reaction} {post.reactions[reaction]}</span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-1 border-y border-slate-100 py-2">
                <button type="button" onClick={() => toggleLike(post)} aria-pressed={post.likedByMe} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-emerald-50 ${post.likedByMe ? 'text-emerald-700' : 'text-slate-500'}`}>
                  <ThumbsUp size={17} /> Thích
                </button>
                <button type="button" onClick={() => toggleDislike(post)} aria-pressed={post.dislikedByMe} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-rose-50 ${post.dislikedByMe ? 'text-rose-600' : 'text-slate-500'}`}>
                  <ThumbsDown size={17} /> Không thích
                </button>
                <span className="relative">
                  <button
                    type="button"
                    aria-label="Thả cảm xúc"
                    aria-expanded={Boolean(openReactions[post.id])}
                    onClick={() => setOpenReactions((current) => ({ ...current, [post.id]: !current[post.id] }))}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                  >
                    <SmilePlus size={17} /> Cảm xúc
                  </button>
                  {openReactions[post.id] && (
                    <span className="absolute bottom-full left-0 z-10 mb-2 flex gap-1 rounded-full border border-slate-100 bg-white p-2 shadow-lg">
                      {reactionOptions.map((reaction) => (
                        <button key={reaction} type="button" aria-label={`Thả cảm xúc ${reaction}`} aria-pressed={post.myReaction === reaction} onClick={() => { toggleReaction(post, reaction); setOpenReactions((current) => ({ ...current, [post.id]: false })) }} className={`rounded-full p-1.5 text-lg transition hover:scale-125 hover:bg-emerald-50 ${post.myReaction === reaction ? 'bg-emerald-50' : ''}`}>
                          {reaction}
                        </button>
                      ))}
                    </span>
                  )}
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400">
                  <MessageCircle size={16} /> {post.comments.length} bình luận
                </span>
              </div>

              <div className="space-y-3 pt-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{comment.initials}</div>
                    <div className="min-w-0 rounded-2xl bg-slate-50 px-3.5 py-2.5">
                      <p className="text-xs font-semibold text-slate-700">{comment.author}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600">{comment.content}</p>
                    </div>
                  </div>
                ))}
                <form onSubmit={(event) => addComment(event, post)} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">{initialsFor(currentName)}</div>
                  <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-4 pr-1 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-50">
                    <span className="sr-only">Viết bình luận</span>
                    <input
                      value={commentDrafts[post.id] ?? ''}
                      onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                      placeholder="Viết bình luận..."
                      className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    <button type="submit" disabled={!(commentDrafts[post.id] ?? '').trim()} aria-label="Gửi bình luận" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:bg-slate-300">
                      <Send size={14} />
                    </button>
                  </label>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ClassAnnouncementsFeed
