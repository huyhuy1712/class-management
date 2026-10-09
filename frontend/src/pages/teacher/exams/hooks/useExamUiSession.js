import { create } from 'zustand'

// UI previews live only in memory until the update/detail APIs are integrated.
const useExamUiSession = create((set) => ({
  exams: {},
  clearExamPreview: (id) => set((state) => {
    const exams = { ...state.exams }
    delete exams[id]
    return { exams }
  }),
  updateExam: (exam, changes) => set((state) => ({
    exams: { ...state.exams, [exam.id]: { ...exam, ...state.exams[exam.id], ...changes } },
  })),
}))
export default useExamUiSession
