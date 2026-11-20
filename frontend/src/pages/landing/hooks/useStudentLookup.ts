import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import publicService from '../../../services/publicService'
import { mapClassExams, mapStudentClasses, mapStudentProfile } from '../helpers/lookupMappers'
import type { ClassItem, ExamRecord, HomeworkRecord, StudentProfile } from '../types'

export default function useStudentLookup() {
  const queryClient = useQueryClient()
  const [studentCodeInput, setStudentCodeInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [studentClasses, setStudentClasses] = useState<ClassItem[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [classDetailLoading, setClassDetailLoading] = useState(false)
  const [exams, setExams] = useState<ExamRecord[]>([])
  const [homeworks, setHomeworks] = useState<HomeworkRecord[]>([])

  const clearResults = () => {
    setStudentProfile(null)
    setStudentClasses([])
    setSelectedClass(null)
    setExams([])
    setHomeworks([])
  }

  const selectClass = (classItem: ClassItem) => {
    setSelectedClass(classItem)
    setClassDetailLoading(true)
    setExams([])
    setHomeworks([])
    try {
      setExams(mapClassExams(classItem))
      setHomeworks((classItem.homeworkAssignments || []).map((item) => ({
        ...item,
        id: item.assignmentId,
      })))
    } finally {
      setClassDetailLoading(false)
    }
  }

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault()
    const trimmedCode = studentCodeInput.trim()
    setHasSearched(true)

    if (!trimmedCode) {
      setErrorMessage('Vui lòng nhập mã số học sinh')
      clearResults()
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    clearResults()

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ['public-student-lookup', trimmedCode.toLowerCase()],
        queryFn: () => publicService.lookupStudentByCode(trimmedCode),
        staleTime: 30_000,
      })
      if (!data?.id) {
        setErrorMessage('Không tìm thấy thông tin học sinh với mã này. Vui lòng kiểm tra lại!')
        return
      }

      const profile = mapStudentProfile(data)
      const classes = mapStudentClasses(data)
      setStudentProfile(profile)
      setStudentClasses(classes)
      if (classes.length > 0) selectClass(classes[0])
    } catch (error: any) {
      console.error('Lỗi khi tra cứu học sinh:', error)
      if (error.response?.status === 404) {
        setErrorMessage(error.response?.data?.message || 'Không tìm thấy thông tin học sinh với mã này. Vui lòng kiểm tra lại!')
      } else if (error.response?.status >= 500) {
        setErrorMessage('Lỗi hệ thống hoặc mất kết nối máy chủ')
      } else {
        setErrorMessage(error.response?.data?.message || 'Lỗi hệ thống hoặc mất kết nối máy chủ. Vui lòng thử lại sau!')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    studentCodeInput,
    setStudentCodeInput,
    isLoading,
    hasSearched,
    errorMessage,
    setErrorMessage,
    studentProfile,
    studentClasses,
    selectedClass,
    classDetailLoading,
    exams,
    homeworks,
    handleSearch,
    selectClass,
    clearResults,
  }
}
