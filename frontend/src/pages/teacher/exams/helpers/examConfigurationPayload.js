function assignmentFields(form) {
  const ids = (values = []) => [...new Set(values.map(Number))]
  return {
    assignmentType: form.accessType,
    classIds: form.accessType === 'CLASS' ? ids(form.classIds) : [],
    studentIds: form.accessType === 'STUDENT' ? ids(form.studentIds) : [],
    ...(form.accessType === 'STUDENT' ? { classId: Number(form.classId) } : {}),
    scoreVisibility: form.scoreVisibility, answerVisibility: form.answerVisibility,
    hideCorrectAnswerOnWrong: Boolean(form.hideWrongAnswers),
    openTime: form.openTime || null, closeTime: form.closeTime || null,
  }
}

export function buildExamConfigurationPayload(form, assignment) {
  if (!assignment?.id) throw new Error('Đề thi chưa có lần giao để sửa cấu hình.')
  return {
    basicInfo: {
      title: form.title.trim(), subjectId: Number(form.subjectId),
      gradeLevel: form.gradeLevel, purpose: form.purpose, description: form.description,
      timeLimit: Number(form.timeLimit), maxAttempts: Number(form.maxAttempts),
    },
    assignment: { ...assignmentFields(form), id: assignment.id, threshold: assignment.threshold ?? null },
  }
}
export function buildNewAssignmentPayload(form, requestId) {
  return { requestId, timeLimit: Number(form.timeLimit), maxAttempts: Number(form.maxAttempts), assignment: { ...assignmentFields(form), answerVisibilityScore: form.threshold ?? null } }
}
