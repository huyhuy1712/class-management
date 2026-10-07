import { ArrowLeft, Plus, Save } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import DashboardLayout from '../../../../layouts/DashboardLayout'
import ExamStructureSidebar from './components/layout/ExamStructureSidebar'
import SectionCard from './components/section/SectionCard'
import useExamBuilder from './hooks/useExamBuilder'

function ExamBuilderPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const builder = useExamBuilder()

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-76px)] overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50/40">
        <div className="mx-auto flex h-full max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-4 flex shrink-0 flex-col gap-4 rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button type="button" onClick={() => navigate('/teacher/exams/create')} className="mb-2 flex cursor-pointer items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700">
                <ArrowLeft size={17} />
                Quay lại cấu hình
              </button>
              <h1 className="text-2xl font-extrabold text-slate-900">{state?.examConfig?.title || 'Tạo nội dung đề thi'}</h1>
              <p className="mt-1 text-sm text-slate-500">Xây dựng section, câu hỏi và đáp án cho đề thi.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
                Tổng điểm: {builder.totalScore}
              </div>
              <button type="button" className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                <Save size={17} />
                Lưu nháp
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[285px_minmax(0,1fr)]">
            <ExamStructureSidebar
              sections={builder.sections}
              totalScore={builder.totalScore}
              onAddSection={builder.addSection}
            />

            <main className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/60 p-4 pr-3 shadow-sm [scrollbar-color:#86efac_transparent] [scrollbar-width:thin] sm:p-5">
              {builder.sections.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Plus size={26} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Bắt đầu xây dựng đề thi</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Tạo phần đầu tiên, sau đó thêm câu hỏi và chọn kiểu đáp án phù hợp cho từng câu.
                  </p>
                  <button type="button" onClick={builder.addSection} className="mt-5 flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                    <Plus size={17} />
                    Thêm section đầu tiên
                  </button>
                </div>
              ) : (
                builder.sections.map((section, index) => (
                  <SectionCard key={section.id} section={section} index={index} actions={builder} />
                ))
              )}
            </main>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ExamBuilderPage
