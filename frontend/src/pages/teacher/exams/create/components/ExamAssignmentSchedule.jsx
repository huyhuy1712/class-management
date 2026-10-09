export default function ExamAssignmentSchedule({ form, errors = {}, onChange }) {
  return <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
    <h3 className="font-semibold text-slate-800">Thời gian mở đề cho đối tượng đã chọn</h3>
    <div className="mt-3 grid gap-4 sm:grid-cols-2">
      {[['openTime', 'Thời gian mở đề'], ['closeTime', 'Thời gian đóng đề']].map(([name, label]) => <label key={name} className="min-w-0"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span><input type="datetime-local" name={name} value={form[name] || ''} onChange={onChange} aria-invalid={Boolean(errors[name])} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-400" />{errors[name] && <span role="alert" className="mt-1 block text-sm text-red-600">{errors[name]}</span>}</label>)}
    </div>
    <p className="mt-3 text-sm text-slate-600">Nếu không nhập thời gian, đề sẽ mở vô thời hạn. Chỉ nhập thời gian mở: đề mở từ thời điểm đó và không có hạn đóng. Chỉ nhập thời gian đóng: đề mở ngay và đóng tại thời điểm đã chọn.</p>
    <p className="mt-1 text-xs text-slate-500">Thời gian theo giờ Việt Nam (UTC+7), áp dụng chung cho lớp hoặc học sinh trong lần giao đề này.</p>
  </div>
}
