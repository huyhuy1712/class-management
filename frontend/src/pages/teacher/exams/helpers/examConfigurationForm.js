// The current configuration form edits one assignment at a time.
export function getExamConfigurationForm(exam) {
  const assignment = exam.assignment ?? (exam.assignments?.length === 1 ? exam.assignments[0] : undefined)
  const contextIds = [...new Set((assignment?.studentClasses ?? []).map((item) => item.classId).filter((id) => id != null))]
  return {
    ...exam,
    ...exam.basicInfo,
    timeLimit: assignment?.timeLimit ?? exam.basicInfo?.timeLimit ?? exam.timeLimit,
    maxAttempts: assignment?.maxAttempts ?? exam.basicInfo?.maxAttempts ?? exam.maxAttempts,
    threshold: exam.threshold ?? assignment?.threshold,
    accessType: exam.accessType ?? assignment?.assignmentType,
    classIds: exam.classIds ?? assignment?.classIds,
    studentIds: exam.studentIds ?? assignment?.studentIds,
    classId: exam.classId ?? assignment?.classId ?? (contextIds.length === 1 ? contextIds[0] : null),
    scoreVisibility: exam.scoreVisibility ?? assignment?.scoreVisibility,
    answerVisibility: exam.answerVisibility ?? assignment?.answerVisibility,
    hideWrongAnswers: exam.hideWrongAnswers ?? assignment?.hideCorrectAnswerOnWrong,
    openTime: exam.openTime ?? assignment?.openTime ?? '',
    closeTime: exam.closeTime ?? assignment?.closeTime ?? '',
  }
}
