import { sortByText } from '../../utils/sortByText'
import { Bell, X, Users, MessageSquare, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import requestService from '../../services/requestService'
import defaultAvatar from '../../assets/images/avatar_default.png'

function formatRequestDate(createdAt) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(createdAt ?? '')

  if (!dateParts) {
    return ''
  }
  
  return `${dateParts[3]}/${dateParts[2]}/${dateParts[1]}`
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const pendingCount = requests.length
  
  const [rejectingId, setRejectingId] = useState(null)
  const [actionError, setActionError] = useState('')

  const [approvingId, setApprovingId] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchRequests = async () => {
      try {
        setLoading(true)
        setError('')

        const data =
          await requestService.getReceivedJoinClassRequests()

        if (!cancelled) {
          setRequests(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Get join class requests error:', error)

        if (!cancelled) {
          setError('Không thể tải yêu cầu tham gia lớp.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchRequests()

    return () => {
      cancelled = true
    }
  }, [])


const handleReject = async (request) => {
  if (!request?.requestId || rejectingId !== null || approvingId !== null) return

  const requestId = request.requestId

  try {
    setRejectingId(requestId)
    setActionError('')

    // BE creates the notification and deletes the request atomically.
    await requestService.rejectJoinClassRequest(requestId)

    // PATCH succeeded: request and detail have been deleted.
    // Xóa khỏi UI ngay
    setRequests((current) =>
      current.filter(
        (item) => item.requestId !== requestId
      )
    )

  } catch (error) {
    console.error(
      'Reject join class request error:',
      error
    )

    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      error.response?.data?.error

    if (status === 400) {
      setActionError(
        message ||
          'Yêu cầu không tồn tại hoặc đã được xử lý.'
      )
    } else if (status === 403) {
      setActionError(
        'Bạn không có quyền xử lý yêu cầu này.'
      )
    } else if (status === 401) {
      setActionError(
        'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
      )
    } else {
      setActionError(
        message ||
          'Không thể từ chối yêu cầu. Vui lòng thử lại.'
      )
    }
  } finally {
    setRejectingId(null)
  }
}

const handleApprove = async (request) => {
  if (!request?.requestId || approvingId !== null || rejectingId !== null) return

  const requestId = request.requestId

  try {
    setApprovingId(requestId)
    setActionError('')

    // BE adds membership, creates notification and deletes the request atomically.
    await requestService.approveJoinClassRequest(requestId)

    // A successful PATCH means membership is saved and request/detail are deleted.
    setRequests((current) =>
      current.filter((item) => item.requestId !== requestId)
    )

  } catch (error) {
    console.error(
      'Approve join class request error:',
      error
    )

    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      error.response?.data?.error

    if (status === 400) {
      if (/đã được xử lý|already processed/i.test(message || '')) {
        setRequests((current) =>
          current.filter((item) => item.requestId !== requestId)
        )
      } else {
        setActionError(
          message ||
            'Yêu cầu hoặc thông tin học sinh không hợp lệ.'
        )
      }
    } else if (status === 403) {
      setActionError(
        message || 'Bạn không có quyền thực hiện thao tác này.'
      )
    } else if (status === 401) {
      setActionError(
        'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
      )
    } else {
      setActionError(
        message ||
          'Không thể chấp nhận yêu cầu. Vui lòng thử lại.'
      )
    }
  } finally {
    setApprovingId(null)
  }
}

  return (
    <>
      {/* BELL */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-green-100 bg-white text-slate-600 transition hover:bg-green-50 hover:text-green-700"
        aria-label="Thông báo"
      >
        <Bell size={20} />

        {/* RED DOT */}
        {pendingCount > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
        )}
      </button>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl">
            
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Bell size={21} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#18301D]">
                      Thông báo
                    </h2>

                    {pendingCount > 0 && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-500">
                        {pendingCount}
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-sm text-slate-400">
                    Yêu cầu và thông báo của bạn
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* TABS */}
            <div className="border-b border-slate-100 px-6">
              <div className="flex gap-6">
                <button
                  type="button"
                  className="relative py-4 text-sm font-semibold text-green-700"
                >
                  Yêu cầu tham gia lớp

                  {pendingCount > 0 && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {pendingCount}
                    </span>
                  )}

                  <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-green-600" />
                </button>

                <button
                  type="button"
                  className="py-4 text-sm font-medium text-slate-400"
                >
                  Thông báo
                </button>
              </div>
            </div>

      {actionError && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            {actionError}
          </p>

          <button
            type="button"
            onClick={() => setActionError('')}
            className="shrink-0 text-red-400 transition hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

            {/* CONTENT */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Đang tải yêu cầu...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <Users size={24} />
                  </div>

                  <p className="mt-4 font-semibold text-[#18301D]">
                    Không có yêu cầu mới
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Các yêu cầu tham gia lớp sẽ xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortByText(requests, (item) => item.fullName).map((request) => (
                    <div
                      key={request.requestId}
                      className="rounded-2xl border border-slate-100 p-4 transition hover:border-green-100 hover:bg-green-50/20"
                    >
                      <div className="flex items-start gap-3">
                        {/* AVATAR */}
                        <img
                          src={request.avatar || defaultAvatar}
                          alt={request.fullName}
                          onError={(event) => {
                            event.currentTarget.src = defaultAvatar
                          }}
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          {/* MESSAGE */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 flex-1 text-sm leading-6 text-slate-600">
                              <span className="font-bold text-[#18301D]">
                                {request.username}
                              </span>{' '}
                              muốn vào lớp{' '}
                              <span className="font-bold text-[#18301D]">
                                {request.classroomName}
                              </span>
                            </p>

                            {formatRequestDate(request.createdAt) && (
                              <time
                                dateTime={request.createdAt}
                                className="shrink-0 pt-1 text-xs text-slate-400"
                              >
                                {formatRequestDate(request.createdAt)}
                              </time>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            {request.studentCode}
                            {' · '}
                            {request.fullName}
                          </p>

                          {/* OPTIONAL MESSAGE */}
                          {request.message && (
                            <div className="mt-3 flex gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                              <MessageSquare
                                size={15}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />

                              <p className="text-sm leading-5 text-slate-500">
                                {request.message}
                              </p>
                            </div>
                          )}

                          {/* ACTIONS */}
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              disabled={
                                approvingId !== null ||
                                rejectingId !== null
                              }
                              onClick={() => handleApprove(request)}
                              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {approvingId === request.requestId ? (
                                <>
                                  <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                  />
                                  Đang chấp nhận...
                                </>
                              ) : (
                                'Chấp nhận'
                              )}
                            </button>

                          <button
                            type="button"
                            disabled={rejectingId !== null || approvingId !== null}
                            onClick={() => handleReject(request)}
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {rejectingId === request.requestId ? (
                              <>
                                <LoaderCircle
                                  size={15}
                                  className="animate-spin"
                                />
                                Đang xử lí...
                              </>
                            ) : (
                              'Từ chối'
                            )}
                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationBell
