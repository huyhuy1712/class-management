import {
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Upload,
} from 'lucide-react'

function CreateMethodSection({
  onCreateOnline,
  onImportFile,
}) {
  return (
<section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">      <h2 className="font-bold text-[#18301D]">
        Chọn cách tạo đề thi
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Chọn cách bạn muốn tạo nội dung đề.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={onCreateOnline}
          className="group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-slate-200 p-5 text-left transition hover:border-green-400 hover:bg-green-50/40"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <FileText size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#18301D]">
              Tạo đề online
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Tạo câu hỏi trực tiếp trên hệ thống.
            </p>
          </div>

          <ChevronRight
            size={20}
            className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-green-600"
          />
        </button>

        <button
          type="button"
          onClick={onImportFile}
          className="group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-slate-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileSpreadsheet size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#18301D]">
              Nhập đề từ file
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Tải file đề thi lên hệ thống.
            </p>
          </div>

          <Upload
            size={20}
            className="text-slate-300 group-hover:text-blue-600"
          />
        </button>
      </div>
    </section>
  )
}

export default CreateMethodSection