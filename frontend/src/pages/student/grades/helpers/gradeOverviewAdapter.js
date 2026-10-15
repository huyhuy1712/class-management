import { getExamAssignmentDate } from '../../exams/helpers/studentExamHelpers.js'

export function adaptGradeItem(item) {
  return { ...item, id: item.attemptId, score: item.scoreVisible ? item.score : null, maxScore: 10,
    subject: item.subjectName, classroom: item.classes?.map((group) => group.name).join(', ') || 'Giao riêng cho bạn',
    date: getExamAssignmentDate(item.submittedAt), minutes: item.durationSeconds == null ? null : Math.round(item.durationSeconds / 60),
    comment: item.teacherComment ?? '',
  }
}
