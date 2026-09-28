import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import subjectService from '../../services/subjectService'

function ClassFormModal({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
  error = null,
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subjectId: '',
    description: '',
  })

  const [subjects, setSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [subjectError, setSubjectError] = useState(null)
  const codeInputRef = useRef(null)

  useEffect(() => {
    const isDuplicateCodeError =
      error && /mã lớp|code|already exists|duplicate/i.test(error)

    if (!isDuplicateCodeError) return

    codeInputRef.current?.focus()
    codeInputRef.current?.select()
  }, [error])

  useEffect(() => {
    if (!isOpen) return

    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true)
        setSubjectError(null)

        const data = await subjectService.getAll()

        setSubjects(data)
      } catch (error) {
        console.error('Get subjects error:', error)

        setSubjectError('Không thể tải danh sách môn học.')
      } finally {
        setLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        code: '',
        subjectId: '',
        description: '',
      })

      setSubjectError(null)
    }
  }, [isOpen])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (
      !formData.name.trim() ||
      !formData.code.trim() ||
      !formData.subjectId
    ) {
      return
    }

    onSubmit({
      name: formData.name.trim(),
      code: formData.code.trim(),
      subjectId: Number(formData.subjectId),
      description: formData.description.trim(),
    })
  }

  if (!isOpen) return null

  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-[2px]"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-8 py-7">
          <div>
            <h2 className="text-2xl font-bold text-[#18301D]">
              Tạo lớp học
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Nhập thông tin để tạo lớp mới
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mx-8 mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="px-8 py-7"
        >
          <div className="space-y-5">
            {/* Tên lớp */}
            <div>
              <label
                htmlFor="class-name"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Tên lớp
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="class-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={100}
                placeholder="VD: Lập trình Java K21"
                disabled={submitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-gray-50"
              />
            </div>

            {/* Mã lớp */}
            <div>
              <label
                htmlFor="class-code"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Mã lớp
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="class-code"
                ref={codeInputRef}
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                maxLength={50}
                placeholder="VD: JAVA-K21"
                disabled={submitting}
                className={`w-full rounded-xl border px-4 py-3.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:ring-4 disabled:bg-gray-50 ${
                  error && /mã lớp|code|already exists|duplicate/i.test(error)
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-green-500 focus:ring-green-100'
                }`}
              />
            </div>

            {/* Môn học */}
            <div>
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Môn học
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                id="subject"
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                disabled={loadingSubjects || submitting}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="">
                  {loadingSubjects
                    ? 'Đang tải môn học...'
                    : 'Chọn môn học'}
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>

              {subjectError && (
                <p className="mt-2 text-sm text-red-500">
                  {subjectError}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Mô tả
                <span className="ml-1 font-normal text-gray-400">
                  (không bắt buộc)
                </span>
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nhập mô tả ngắn về lớp học..."
                rows={3}
                disabled={submitting}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingSubjects ||
                !formData.name.trim() ||
                !formData.code.trim() ||
                !formData.subjectId
              }
              className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
            >
              {submitting ? 'Đang tạo...' : 'Tạo lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClassFormModal