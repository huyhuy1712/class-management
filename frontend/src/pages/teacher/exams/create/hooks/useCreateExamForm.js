import { useMemo, useState } from 'react'

import {
  EXAM_ACCESS_TYPE,
  INITIAL_EXAM_FORM,
} from '../helpers/examFormConstants'

function useCreateExamForm({ classes = [], students = [] } = {}) {
  const [form, setForm] = useState(INITIAL_EXAM_FORM)
  const [errors, setErrors] = useState({})
  const [accessType, setAccessType] = useState(EXAM_ACCESS_TYPE.ALL)
  const [selectedClasses, setSelectedClasses] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [selectedStudentClassId, setSelectedStudentClassId] = useState(null)
  const [classSearch, setClassSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const handleAccessChange = (type) => {
    setAccessType(type)
    if (type !== EXAM_ACCESS_TYPE.CLASS) setSelectedClasses([])
    if (type !== EXAM_ACCESS_TYPE.STUDENT) {
      setSelectedStudents([])
      setSelectedStudentClassId(null)
    }
  }

  const toggleClass = (classId) => {
    setSelectedClasses((current) =>
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId],
    )
  }

  const toggleStudent = (studentId) => {
    setSelectedStudents((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    )
  }

  const filteredClasses = useMemo(() => {
    const keyword = classSearch.trim().toLowerCase()
    if (!keyword) return classes
    return classes.filter((item) =>
      String(item.name ?? '').toLowerCase().includes(keyword) ||
      String(item.code ?? '').toLowerCase().includes(keyword),
    )
  }, [classes, classSearch])

  const filteredStudents = useMemo(() => {
    const keyword = studentSearch.trim().toLowerCase()
    if (!keyword) return students
    return students.filter((student) =>
      String(student.fullName ?? '').toLowerCase().includes(keyword) ||
      String(student.studentCode ?? '').toLowerCase().includes(keyword),
    )
  }, [students, studentSearch])

  const studentsInSelectedClass = useMemo(
    () => filteredStudents.filter((student) =>
      student.classes?.some(
        (classroom) => String(classroom.id) === String(selectedStudentClassId),
      ),
    ),
    [filteredStudents, selectedStudentClassId],
  )

  const validate = () => {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Vui lòng nhập tên đề thi.'
    if (!form.subjectId) nextErrors.subjectId = 'Vui lòng chọn môn học.'
    if (!form.gradeLevel) nextErrors.gradeLevel = 'Vui lòng chọn khối / cấp độ.'
    if (Number(form.timeLimit) < 1) nextErrors.timeLimit = 'Thời gian làm bài phải từ 1 phút trở lên.'
    if (Number(form.maxAttempts) < 0) nextErrors.maxAttempts = 'Số lần làm tối đa phải từ 1 trở lên, hoặc nhập 0 để không giới hạn.'
    if (Number(form.maxAttempts) > 0 && Number(form.maxAttempts) < 1) nextErrors.maxAttempts = 'Số lần làm tối đa phải từ 1 trở lên, hoặc nhập 0 để không giới hạn.'
    if (Number(form.maxScore) < 1) nextErrors.maxScore = 'Điểm tối đa phải từ 1 trở lên.'

    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      requestAnimationFrame(() => {
        document.querySelector(`[name="${firstError}"]`)?.focus()
        document.querySelector(`[name="${firstError}"]`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      })
    }
    return Object.keys(nextErrors).length === 0
  }

  const buildExamData = () => ({
    ...form,
    subjectId: Number(form.subjectId),
    timeLimit: Number(form.timeLimit),
    maxAttempts: Number(form.maxAttempts),
    maxScore: Number(form.maxScore),
    accessType,
    classIds: accessType === EXAM_ACCESS_TYPE.CLASS ? selectedClasses : [],
    studentIds: accessType === EXAM_ACCESS_TYPE.STUDENT ? selectedStudents : [],
  })

  return {
    form, errors, accessType,
    selectedClasses, selectedStudents, selectedStudentClassId,
    classSearch, studentSearch,
    filteredClasses, filteredStudents, studentsInSelectedClass,
    handleChange, handleAccessChange,
    toggleClass, toggleStudent, setSelectedStudentClassId,
    setClassSearch, setStudentSearch,
    validate, buildExamData,
  }
}

export default useCreateExamForm
