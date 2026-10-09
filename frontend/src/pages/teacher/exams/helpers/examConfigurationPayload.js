export function buildExamConfigurationPayload(form, assignment) {
  if (!assignment?.id) throw new Error('Đề thi chưa có lần giao để sửa cấu hình.')
  const ids = (values = []) => [...new Set(values.map(Number))]
  return {
    basicInfo: {
      title: form.title.trim(), subjectId: Number(form.subjectId),
      gradeLevel: form.gradeLevel, purpose: form.purpose, description: form.description,
      timeLimit: Number(form.timeLimit), maxAttempts: Number(form.maxAttempts),
    },
    assignment: {
      id: assignment.id, assignmentType: form.accessType,
      classIds: form.accessType === 'CLASS' ? ids(form.classIds) : [],
      studentIds: form.accessType === 'STUDENT' ? ids(form.studentIds) : [],
      scoreVisibility: form.scoreVisibility, answerVisibility: form.answerVisibility,
      threshold: assignment.threshold ?? null,
      hideCorrectAnswerOnWrong: Boolean(form.hideWrongAnswers),
      openTime: form.openTime || null, closeTime: form.closeTime || null,
    },
  }
}
