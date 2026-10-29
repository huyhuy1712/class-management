import { BookOpen, ClipboardCheck, ShieldCheck } from 'lucide-react'
import FrogLoading from '../../../utils/FrogLoading'
import { sortByText } from '../../../utils/sortByText'

export default function AccountDetailsCard({
  user,
  student,
  roleLabel,
  activity,
  examCount,
}) {
  const { classCount, classCountError } = activity

  return (
    <section className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
        <ShieldCheck size={19} />
      </div>
      <h3 className="mt-4 font-bold text-[#18301D]">Thông tin tài khoản</h3>

      <div className="mt-4 space-y-4">
        <AccountValue label="Tên đăng nhập" value={user?.username || '---'} />
        <AccountValue label="Email" value={user?.email || '---'} breakAll />
        <AccountValue
          label={student ? 'Mã học sinh' : 'Mã giáo viên'}
          value={(student ? user?.studentCode : user?.teacherCode) || '---'}
        />
        <AccountValue label="Vai trò" value={roleLabel} />
        <div>
          <p className="text-xs text-gray-400">Trạng thái</p>
          <span className="mt-1 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {user?.status === 'ACTIVE' ? 'Đang hoạt động' : user?.status || '---'}
          </span>
        </div>
      </div>

      <div className="my-5 border-t border-gray-100" />
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
          {student ? 'Hoạt động học tập' : 'Hoạt động giảng dạy'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-sky-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sky-600">
              <BookOpen size={16} />
            </div>
            <p className="mt-3 text-xl font-bold text-sky-700">
              {classCountError
                ? '--'
                : classCount === null
                  ? <FrogLoading compact label="" />
                  : classCount}
            </p>
            <p className="mt-1 text-xs leading-4 text-gray-500">
              {student ? 'Lớp đang học' : 'Lớp đang dạy'}
            </p>
          </div>
          <div className="rounded-xl bg-violet-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-600">
              <ClipboardCheck size={16} />
            </div>
            <p className="mt-3 text-xl font-bold text-violet-700">{examCount}</p>
            <p className="mt-1 text-xs leading-4 text-gray-500">
              {student ? 'Bài kiểm tra đã làm' : 'Bài kiểm tra'}
            </p>
          </div>
        </div>
        {student && activity.classes.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500">Lớp đang học</p>
            <ul className="mt-2 space-y-2">
              {sortByText(activity.classes, (item) => item.name).map((item) => (
                <li key={item.id} className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">
                  {item.name}
                  <span className="ml-2 text-xs text-slate-500">{item.code}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function AccountValue({ label, value, breakAll = false }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-gray-700 ${breakAll ? 'break-all' : ''}`}>
        {value}
      </p>
    </div>
  )
}
