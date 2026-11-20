export interface StudentProfile {
  id: number | string
  studentCode: string
  fullName: string
  email?: string
  phone?: string
  avatar?: string
}

export interface AbsenceDetail {
  sessionName?: string
  date: string
  attendanceTime?: string
  status: 'PRESENT' | 'LATE' | 'ABSENT' | string
  note?: string
}

export interface ExamScoreItem {
  examTitle: string
  examType?: string
  date?: string
  score?: number | null
  maxScore?: number | null
  status?: string
  teacherComment?: string
}

export interface HomeworkItem {
  assignmentId: number | string
  title: string
  subjectName?: string
  createdDate?: string
  dueDate?: string
  score?: number | null
  maxScore?: number | null
  status?: string
  teacherComment?: string
}

export interface ClassItem {
  id: number | string
  name: string
  code: string
  academicYear?: string
  subjectName?: string
  teacherName?: string
  description?: string
  status?: string
  absentCount?: number
  totalSessions?: number
  absenceDetails?: AbsenceDetail[]
  examScores?: ExamScoreItem[]
  homeworkAssignments?: HomeworkItem[]
}

export interface ExamRecord {
  id: number | string
  title?: string
  examTitle?: string
  examType?: string
  name?: string
  createdAt?: string
  date?: string
  score?: number | string | null
  maxScore?: number | string | null
  comment?: string
  teacherComment?: string
  status?: string
}

export interface HomeworkRecord extends HomeworkItem {
  id: number | string
}
