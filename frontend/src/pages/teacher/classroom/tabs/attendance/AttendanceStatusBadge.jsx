function AttendanceStatusBadge({ status }) {
  const config = {
    PRESENT: {
      label: 'Có mặt',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    ABSENT: {
      label: 'Vắng',
      className: 'border-red-200 bg-red-50 text-red-600',
    },
    LATE: {
      label: 'Đi trễ',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    },
  }

  const current = config[status] ?? {
    label: status || 'Chưa xác định',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${current.className}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {current.label}
    </span>
  )
}

export default AttendanceStatusBadge
