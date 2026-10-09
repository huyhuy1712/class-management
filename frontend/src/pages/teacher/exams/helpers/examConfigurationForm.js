// The current configuration form edits one assignment at a time.
export function getExamConfigurationForm(exam) {
  const assignment = exam.assignment ?? (exam.assignments?.length === 1 ? exam.assignments[0] : undefined)
  return {
    ...exam,
    ...exam.basicInfo,
    accessType: exam.accessType ?? assignment?.assignmentType,
    classIds: exam.classIds ?? assignment?.classIds,
    studentIds: exam.studentIds ?? assignment?.studentIds,
    scoreVisibility: exam.scoreVisibility ?? assignment?.scoreVisibility,
    answerVisibility: exam.answerVisibility ?? assignment?.answerVisibility,
    hideWrongAnswers: exam.hideWrongAnswers ?? assignment?.hideCorrectAnswerOnWrong,
    openTime: exam.openTime ?? assignment?.openTime ?? '',
    closeTime: exam.closeTime ?? assignment?.closeTime ?? '',
  }
}
