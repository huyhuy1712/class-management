import {
  ArrowDownUp,
  FileCheck2,
  Plus,
  Search,
} from 'lucide-react'
import { useState } from 'react'

import ExamTable from './components/ExamTable'
import useExamFilters from './hooks/useExamFilters'
import DashboardLayout from '../../../layouts/DashboardLayout'
import { useNavigate } from 'react-router-dom'


function ExamManagementPage() {

  const navigate = useNavigate()
  // MOCK DATA
  // Sau này thay bằng API

  const [exams] = useState([
    {
      id: 1,
      code: 'JAVA-MID-01',
      title:
        'Kiểm tra giữa kỳ - Lập trình Java',
      submissionCount: 32,
      status: 'PUBLISHED',
      assignedClassCount: 2,
      createdAt: '2026-10-06T08:30:00',
    },
    {
      id: 2,
      code: 'DB-QUIZ-01',
      title: 'Quiz chương 1 - Cơ sở dữ liệu',
      submissionCount: 45,
      status: 'PUBLISHED',
      assignedClassCount: 3,
      createdAt: '2026-10-04T14:20:00',
    },
    {
      id: 3,
      code: 'JAVA-FINAL',
      title: 'Đề thi cuối kỳ - Java nâng cao',
      submissionCount: 0,
      status: 'DRAFT',
      assignedClassCount: 0,
      createdAt: '2026-09-28T09:15:00',
    },
    {
      id: 4,
      code: 'WEB-TEST-02',
      title: 'Kiểm tra ReactJS - Chương 2',
      submissionCount: 38,
      status: 'CLOSED',
      assignedClassCount: 1,
      createdAt: '2026-09-20T19:30:00',
    },
  ])

  const {
    search,
    setSearch,

    status,
    setStatus,

    sortOrder,
    setSortOrder,

    filteredExams,
  } = useExamFilters(exams)

  const handleCreate = () => {
    console.log('Create exam')
  }

  const handleView = (exam) => {
  navigate(`/teacher/exams/${exam.id}`)
}

  const handleEdit = (exam) => {
    console.log('Edit:', exam)
  }

  const handleDelete = (exam) => {
    console.log('Delete:', exam)
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F7F9F7] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700">
              <FileCheck2 size={17} />
              Quản lý đề thi
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#18301D] sm:text-3xl">
              Đề thi của tôi
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Tạo, quản lý và theo dõi các đề thi
              của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <Plus size={18} />
            Tạo đề thi
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          {/* SEARCH */}
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Tìm kiếm theo tên hoặc mã đề..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-50"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* STATUS FILTER */}
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-50"
            >
              <option value="ALL">
                Tất cả trạng thái
              </option>

              <option value="PUBLISHED">
                Đã xuất bản
              </option>

              <option value="DRAFT">
                Bản nháp
              </option>

              <option value="CLOSED">
                Đã đóng
              </option>
            </select>

            {/* SORT */}
            <div className="relative">
              <ArrowDownUp
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value,
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-600 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-50"
              >
                <option value="NEWEST">
                  Mới nhất
                </option>

                <option value="OLDEST">
                  Cũ nhất
                </option>
              </select>

              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* RESULT */}
        <div className="mb-3">
          <p className="text-sm text-slate-500">
            Đang có{' '}
            <span className="font-semibold text-slate-700">
              {filteredExams.length}
            </span>{' '}
            đề thi
          </p>
        </div>

        {/* TABLE */}
        <ExamTable
          exams={filteredExams}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ExamManagementPage