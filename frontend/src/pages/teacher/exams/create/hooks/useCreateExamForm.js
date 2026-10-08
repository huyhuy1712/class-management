import { useEffect, useMemo, useState } from 'react'
import { loadExamDraft, saveExamDraft } from '../../draft/examDraftStorage'

import {
  EXAM_ACCESS_TYPE,
} from '../helpers/examFormConstants'
import { normalizeExamForm, validateExamForm } from '../helpers/examFormValidation'

function useCreateExamForm({ classes = [], students = [] } = {}) {
  const savedDraft = useMemo(() => loadExamDraft(), [])
  const generalDraft = savedDraft?.general
  const [form, setForm] = useState(() => normalizeExamForm(generalDraft?.form))
  const [errors, setErrors] = useState(savedDraft?.configErrors ?? {})
  const [accessType, setAccessType] = useState(generalDraft?.accessType ?? EXAM_ACCESS_TYPE.ALL)
  const [selectedClasses, setSelectedClasses] = useState(generalDraft?.selectedClasses ?? [])
  const [selectedStudents, setSelectedStudents] = useState(generalDraft?.selectedStudents ?? [])
  const [selectedStudentClassId, setSelectedStudentClassId] = useState(generalDraft?.selectedStudentClassId ?? null)
  const [classSearch, setClassSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  useEffect(() => {
    saveExamDraft({
      general: { form, accessType, selectedClasses, selectedStudents, selectedStudentClassId },
    })
  }, [form, accessType, selectedClasses, selectedStudents, selectedStudentClassId])

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
    setErrors((current) => ({ ...current, accessType: undefined }))
    setAccessType(type)
    if (type !== EXAM_ACCESS_TYPE.CLASS) setSelectedClasses([])
    if (type !== EXAM_ACCESS_TYPE.STUDENT) {
      setSelectedStudents([])
      setSelectedStudentClassId(null)
    }
  }

  const toggleClass = (classId) => {
    setErrors((current) => ({ ...current, accessType: undefined }))
    setSelectedClasses((current) =>
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId],
    )
  }

  const toggleStudent = (studentId) => {
    setErrors((current) => ({ ...current, accessType: undefined }))
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
    const nextErrors = validateExamForm(form, accessType, selectedClasses, selectedStudents)
    if (accessType === EXAM_ACCESS_TYPE.CLASS && selectedClasses.some((id) => !classes.some((item) => item.id === Number(id) && item.status === 'ACTIVE'))) nextErrors.accessType = 'Một lớp đã chọn không còn hoạt động hoặc không thuộc phạm vi của bạn. Vui lòng chọn lại.'
    if (accessType === EXAM_ACCESS_TYPE.STUDENT && selectedStudents.some((id) => !students.some((item) => item.id === Number(id) && item.status === 'ACTIVE' && item.classes?.some((classroom) => classroom.status === 'ACTIVE')))) nextErrors.accessType = 'Một học sinh đã chọn không còn đủ điều kiện làm bài. Vui lòng chọn lại.'

    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      requestAnimationFrame(() => {
        if (firstError === 'accessType') {
          const section = document.getElementById('exam-access')
          section?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          section?.querySelector('button, input')?.focus()
          return
        }
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
