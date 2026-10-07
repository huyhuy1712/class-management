import { useMemo, useState } from 'react'

import {
  EXAM_ACCESS_TYPE,
  INITIAL_EXAM_FORM,
} from '../helpers/examFormConstants'

function useCreateExamForm({
  classes = [],
  students = [],
} = {}) {
  const [form, setForm] = useState(INITIAL_EXAM_FORM)

  const [accessType, setAccessType] = useState(
    EXAM_ACCESS_TYPE.ALL,
  )

  const [selectedClasses, setSelectedClasses] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [selectedStudentClassId, setSelectedStudentClassId] = useState(null)

  const [classSearch, setClassSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleAccessChange = (type) => {
    setAccessType(type)

    if (type !== EXAM_ACCESS_TYPE.CLASS) {
      setSelectedClasses([])
    }

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

    return classes.filter(
      (item) =>
        String(item.name ?? '')
          .toLowerCase()
          .includes(keyword) ||
        String(item.code ?? '')
          .toLowerCase()
          .includes(keyword),
    )
  }, [classes, classSearch])

  const filteredStudents = useMemo(() => {
    const keyword = studentSearch.trim().toLowerCase()

    if (!keyword) return students

    return students.filter(
      (student) =>
        String(student.fullName ?? '')
          .toLowerCase()
          .includes(keyword) ||
        String(student.studentCode ?? '')
          .toLowerCase()
          .includes(keyword),
    )
  }, [students, studentSearch])

  const studentsInSelectedClass = useMemo(
    () =>
      filteredStudents.filter(
        (student) =>
          String(student.classId) ===
          String(selectedStudentClassId),
      ),
    [filteredStudents, selectedStudentClassId],
  )

  const buildExamData = () => ({
    ...form,

    subjectId: Number(form.subjectId),
    timeLimit: Number(form.timeLimit),
    maxAttempts: Number(form.maxAttempts),
    maxScore: Number(form.maxScore),

    accessType,

    classIds:
      accessType === EXAM_ACCESS_TYPE.CLASS
        ? selectedClasses
        : [],

    studentIds:
      accessType === EXAM_ACCESS_TYPE.STUDENT
        ? selectedStudents
        : [],
  })

  return {
    form,
    accessType,

    selectedClasses,
    selectedStudents,
    selectedStudentClassId,

    classSearch,
    studentSearch,

    filteredClasses,
    filteredStudents,
    studentsInSelectedClass,

    handleChange,
    handleAccessChange,

    toggleClass,
    toggleStudent,
    setSelectedStudentClassId,

    setClassSearch,
    setStudentSearch,

    buildExamData,
  }
}

export default useCreateExamForm