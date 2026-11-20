import type { ClassItem, ExamRecord, StudentProfile } from '../types'

export function mapStudentProfile(data: any): StudentProfile {
  return {
    id: data.id,
    studentCode: data.studentCode,
    fullName: data.fullName || 'Học sinh',
    email: data.email,
    phone: data.phone,
    avatar: data.avatar || data.avatarUrl,
  }
}

export function mapStudentClasses(data: any): ClassItem[] {
  return (data.classrooms || []).map((cls: any) => ({
    id: cls.classId,
    name: cls.className,
    code: cls.classCode,
    academicYear: cls.academicYear || 'Năm học 2026 - 2027',
    subjectName: cls.subjectName,
    teacherName: cls.teacherName,
    description: cls.description,
    status: cls.status,
    absentCount: cls.absentCount ?? 0,
    totalSessions: cls.totalSessions ?? 0,
    absenceDetails: cls.absenceDetails || [],
    examScores: cls.examScores || [],
    homeworkAssignments: cls.homeworkAssignments || [],
  }))
}

export function mapClassExams(classItem: ClassItem): ExamRecord[] {
  return (classItem.examScores || []).map((exam, index) => ({
    id: `exam-${classItem.id}-${index}`,
    title: exam.examTitle,
    examTitle: exam.examTitle,
    examType: exam.examType,
    date: exam.date,
    score: exam.score,
    maxScore: exam.maxScore,
    status: exam.status,
    teacherComment: exam.teacherComment,
    comment: exam.teacherComment,
  }))
}
