import { ImagePlus, Trash2 } from 'lucide-react'
import FrogLoading from '../../../utils/FrogLoading'

export default function ProfileHeader({
  user,
  roleLabel,
  avatarPreview,
  avatarInputRef,
  uploadingAvatar,
  deletingAvatar,
  onAvatarError,
  onAvatarChange,
  onChooseAvatar,
  onDeleteAvatar,
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14532D] via-[#15803D] to-[#16A34A] shadow-lg shadow-green-900/10">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
      <div className="absolute bottom-[-5rem] left-1/3 h-40 w-40 rounded-full bg-lime-300/10" />

      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={avatarPreview}
              alt={user?.fullName || 'Ảnh đại diện'}
              onError={onAvatarError}
              className="h-20 w-20 rounded-2xl border-4 border-white/90 bg-white object-cover shadow-lg sm:h-24 sm:w-24"
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              title="Chọn ảnh đại diện từ máy"
              aria-label="Chọn ảnh đại diện từ máy"
              onClick={onChooseAvatar}
              disabled={uploadingAvatar || deletingAvatar}
              className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-green-600 text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus size={16} />
            </button>
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-white sm:text-2xl">
              {user?.fullName || user?.username}
            </h2>
            <p className="mt-1 truncate text-sm text-green-100/80">@{user?.username}</p>
            {user?.avatar && user.avatar !== 'avatar' && (
              <button
                type="button"
                onClick={onDeleteAvatar}
                disabled={uploadingAvatar || deletingAvatar}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-100 transition hover:text-white hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={13} />
                {deletingAvatar ? <FrogLoading compact label="Đang gỡ ảnh..." /> : 'Gỡ ảnh đại diện'}
              </button>
            )}
            {uploadingAvatar && (
              <FrogLoading label="Đang tải ảnh lên..." className="mt-2 text-xs text-green-100" />
            )}
          </div>
        </div>

        <span className="w-fit rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
          {roleLabel}
        </span>
      </div>
    </section>
  )
}
