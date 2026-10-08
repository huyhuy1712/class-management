import { isExamPoint, pointUnits, validateGroupScore } from './examScoringValidation.js'

const hasText = (value) => String(value ?? '').trim().length > 0
const hasMedia = (item) => item.imageFile || item.audioFile || item.imageMedia?.mediaId || item.audioMedia?.mediaId

export function validateExamBuilder(sections) {
  const errors = {}
  const add = (id, message) => { if (!errors[id]) errors[id] = message }
  let questionCount = 0, groupCount = 0, optionCount = 0, totalPoints = 0
  if (!sections.length || sections.length > 50) add('builder-root', 'Đề thi phải có từ 1 đến 50 phần.')
  sections.forEach((section, sectionIndex) => {
    const sectionId = `section-${section.id}`
    if (!hasText(section.title) || section.title.length > 255) add(sectionId, `Phần ${sectionIndex + 1} cần tiêu đề từ 1 đến 255 ký tự.`)
    if (!section.questions.length || section.questions.length > 100) add(sectionId, 'Mỗi phần phải có từ 1 đến 100 câu hỏi.')
    section.questions.forEach((question, questionIndex) => {
      questionCount++
      const id = `question-${question.id}`
      const name = `Câu ${questionIndex + 1} - Phần ${sectionIndex + 1}`
      if (!hasText(question.content) || question.content.length > 20000) add(id, `${name} cần nội dung từ 1 đến 20000 ký tự.`)
      if (!isExamPoint(question.point) || Number(question.point) <= 0) add(id, `${name} cần điểm lớn hơn 0, tối đa 9999.99 và 2 chữ số thập phân.`)
      totalPoints += pointUnits(question.point) || 0
      const groups = question.answerGroups ?? []
      if (!groups.length || groups.length > 20) add(id, `${name} phải có từ 1 đến 20 nhóm đáp án.`)
      groups.forEach((group) => {
        groupCount++
        const groupId = `answer-group-${group.id}`
        const items = group.answers ?? []
        const choice = group.answerType === 'CHOICE'
        const trueFalse = group.answerType === 'TRUE_FALSE'
        if (!['CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'TEXT'].includes(group.answerType)) return add(groupId, 'Vui lòng chọn dạng đáp án.')
        if (!items.length || items.length > 50 || (choice && items.length < 2) || (!choice && !trueFalse && items.length !== 1)) add(groupId, 'Số nội dung đáp án không phù hợp: trắc nghiệm cần ít nhất 2 phương án, nhóm văn bản cần đúng 1 nội dung.')
        if (choice || trueFalse) optionCount += items.length
        items.forEach((item) => {
          if (String(item.content ?? '').length > 20000) add(groupId, 'Nội dung đáp án tối đa 20000 ký tự.')
          if ((choice || trueFalse) && !hasText(item.content) && !hasMedia(item)) add(groupId, 'Mỗi phương án/ý phải có nội dung, ảnh hoặc audio.')
          if (group.answerType === 'SHORT_ANSWER' && !hasText(item.content)) add(groupId, 'Trả lời ngắn cần đáp án chuẩn bằng văn bản.')
        })
        if (choice) {
          const correct = items.filter((item) => item.isCorrect === true).length
          if (correct === 0 || (group.choiceMode !== 'MULTIPLE' && correct !== 1)) add(groupId, 'Trắc nghiệm một lựa chọn cần đúng 1 phương án đúng; nhiều lựa chọn cần ít nhất 1.')
        }
        const scoreError = validateGroupScore({ ...group, answers: items })
        if (scoreError) add(groupId, scoreError)
      })
      if (groups.every((group) => isExamPoint(group.point)) && groups.reduce((sum, group) => sum + pointUnits(group.point), 0) !== pointUnits(question.point)) add(id, `${name}: điểm câu phải bằng tổng điểm nhóm đáp án.`)
    })
  })
  if (questionCount > 500 || groupCount > 2000 || optionCount > 10000) add('builder-root', 'Đề vượt giới hạn 500 câu hỏi, 2000 nhóm hoặc 10000 phương án.')
  if (totalPoints > 999999) add('builder-root', 'Tổng điểm đề không được vượt quá 9999.99.')
  return { errors, firstErrorId: Object.keys(errors)[0] ?? null, isValid: Object.keys(errors).length === 0 }
}
