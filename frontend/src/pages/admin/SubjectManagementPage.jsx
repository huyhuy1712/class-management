import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useResourceQuery from '../../query/useResourceQuery'
import subjectService from '../../services/subjectService'

const emptyForm = { name: '', code: '', description: '' }

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback
}

export default function SubjectManagementPage() {
  const queryClient = useQueryClient()
  const { data: subjects = [], isPending, error, queryKey } = useResourceQuery('subjects')
  const [keyword, setKeyword] = useState('')
  const [modalMode, setModalMode] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const refreshSubjects = () => queryClient.invalidateQueries({ queryKey })
  const createMutation = useMutation({
    mutationFn: subjectService.create,
    onSuccess: refreshSubjects,
  })
  const updateMutation = useMutation({
    mutationFn: ({ subjectId, subject }) => subjectService.update(subjectId, subject),
    onSuccess: refreshSubjects,
  })
  const deleteMutation = useMutation({
    mutationFn: subjectService.delete,
    onSuccess: refreshSubjects,
  })
  const saving = createMutation.isPending || updateMutation.isPending

  const filteredSubjects = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return subjects.filter((subject) =>
      [subject.name, subject.code, subject.description]
        .some((value) => String(value ?? '').toLowerCase().includes(normalizedKeyword))
    )
  }, [subjects, keyword])

  function openCreateModal() {
    setSelectedSubject(null)
    setForm({ ...emptyForm })
    setFormError('')
    setModalMode('create')
  }

  function openEditModal(subject) {
    setSelectedSubject(subject)
    setForm({
      name: subject.name,
      code: subject.code,
      description: subject.description ?? '',
    })
    setFormError('')
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedSubject(null)
    setFormError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
    }
    const request = modalMode === 'create'
      ? createMutation.mutateAsync(payload)
      : updateMutation.mutateAsync({ subjectId: selectedSubject.id, subject: payload })

    request.then(closeModal).catch((mutationError) => {
      setFormError(getErrorMessage(mutationError, 'Không thể lưu môn học. Vui lòng thử lại.'))
    })
  }

  function handleDelete(subject) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa môn học "${subject.name}" không?`)) return

    deleteMutation.mutate(subject.id, {
      onError: (mutationError) => {
        window.alert(getErrorMessage(mutationError, 'Không thể xóa môn học. Vui lòng thử lại.'))
      },
    })
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-heading">
        <div>
          <span className="admin-eyebrow">SUBJECT MANAGEMENT</span>
          <h2>Quản lý môn học</h2>
          <p>Thêm, cập nhật và xóa các môn học trong hệ thống.</p>
        </div>
        <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
          <span>＋</span> Thêm môn học
        </button>
      </div>

      {error && (
        <p className="admin-data-error" role="alert">
          Không thể tải danh sách môn học. Vui lòng tải lại trang hoặc đăng nhập lại.
        </p>
      )}

      <div className="admin-stats admin-users-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon blue">◇</div>
          <span>Tổng môn học</span>
          <strong>{isPending ? '...' : subjects.length}</strong>
          <small>Môn học trong hệ thống</small>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <h3>Danh sách môn học</h3>
            <p>Tìm kiếm theo tên, mã hoặc mô tả môn học.</p>
          </div>
          <span className="admin-result-count">
            {isPending ? 'Đang tải...' : `${filteredSubjects.length} môn học`}
          </span>
        </div>

        <div className="admin-user-filters">
          <div className="admin-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Tìm theo tên, mã hoặc mô tả..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              aria-label="Tìm môn học"
            />
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-user-table">
            <thead>
              <tr>
                <th>TÊN MÔN HỌC</th>
                <th>MÃ MÔN HỌC</th>
                <th>MÔ TẢ</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isPending && <tr><td colSpan={4}>Đang tải dữ liệu môn học...</td></tr>}
              {!isPending && filteredSubjects.map((subject) => (
                <tr key={subject.id}>
                  <td><strong>{subject.name}</strong></td>
                  <td><span className="admin-username">{subject.code}</span></td>
                  <td className="admin-subject-description">{subject.description || '—'}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-icon-btn edit"
                        title="Chỉnh sửa"
                        aria-label={`Sửa môn ${subject.name}`}
                        onClick={() => openEditModal(subject)}
                      >✎</button>
                      <button
                        type="button"
                        className="admin-icon-btn delete"
                        title="Xóa môn học"
                        aria-label={`Xóa môn ${subject.name}`}
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(subject)}
                      >♲</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isPending && !error && filteredSubjects.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="admin-no-results">
                      <span>⌕</span>
                      <strong>{subjects.length ? 'Không tìm thấy môn học' : 'Chưa có môn học'}</strong>
                      <p>{subjects.length ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Thêm môn học để bắt đầu quản lý.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalMode && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="subject-modal-title">
            <div className="admin-modal__header">
              <div>
                <span className="admin-eyebrow">SUBJECT</span>
                <h2 id="subject-modal-title">
                  {modalMode === 'create' ? 'Thêm môn học' : 'Chỉnh sửa môn học'}
                </h2>
                <p>Nhập thông tin môn học bên dưới.</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={closeModal} aria-label="Đóng modal">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal__body">
                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-field--full">
                    <label htmlFor="subject-name">Tên môn học <span>*</span></label>
                    <input
                      id="subject-name"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="admin-form-field admin-form-field--full">
                    <label htmlFor="subject-code">Mã môn học <span>*</span></label>
                    <input
                      id="subject-code"
                      name="code"
                      value={form.code}
                      onChange={handleFormChange}
                      maxLength={50}
                      required
                    />
                  </div>
                  <div className="admin-form-field admin-form-field--full">
                    <label htmlFor="subject-description">Mô tả</label>
                    <textarea
                      id="subject-description"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      rows={4}
                    />
                  </div>
                </div>
                {formError && <div className="admin-form-error" role="alert">{formError}</div>}
              </div>
              <div className="admin-modal__footer">
                <button type="button" className="admin-secondary-btn" onClick={closeModal}>Hủy</button>
                <button type="submit" className="admin-primary-btn" disabled={saving}>
                  {saving ? 'Đang lưu...' : modalMode === 'create' ? '＋ Tạo môn học' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
