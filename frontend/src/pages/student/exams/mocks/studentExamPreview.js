const previewExams = [{
  assignmentId: 'preview-assignment',
  title: 'Kiểm tra Toán 12 - Chương 1',
  code: 'MATH12-CH01',
  classes: [{ id: 'preview-class', name: 'Lớp Toán 12A1' }],
  createdAt: '2026-10-11T08:00:00',
  timeLimit: 45,
  attemptStatus: 'NOT_STARTED',
  canEnter: true,
}]

export async function loadStudentExamPreview() {
  return previewExams
}
