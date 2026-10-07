const hasText = (value) => String(value ?? '').trim().length > 0
const numeric = (value) => Number(value)

export function validateExamBuilder(sections) {
  const errors = {}
  let firstErrorId = null
  const add = (id, message) => {
    if (!errors[id]) errors[id] = message
    if (!firstErrorId) firstErrorId = id
  }

  if (!sections.length) add('builder-root', 'Đề thi phải có ít nhất 1 phần.')

  sections.forEach((section, sectionIndex) => {
    if (!hasText(section.title)) add(`section-${section.id}`, `Phần ${sectionIndex + 1} chưa có tiêu đề.`)
    if (!section.questions.length) add(`section-${section.id}`, `Phần ${sectionIndex + 1} phải có ít nhất 1 câu hỏi.`)

    section.questions.forEach((question, questionIndex) => {
      const qName = `Câu ${questionIndex + 1} - Phần ${sectionIndex + 1}`
      if (!hasText(question.content)) add(`question-${question.id}`, `${qName} chưa có nội dung.`)
      if (!Number.isFinite(numeric(question.point)) || numeric(question.point) <= 0) add(`question-${question.id}`, `${qName} phải có điểm lớn hơn 0.`)
      if (!(question.answerGroups ?? []).length) add(`question-${question.id}`, `${qName} phải có ít nhất 1 đáp án.`)

      ;(question.answerGroups ?? []).forEach((group, groupIndex) => {
        const id = `answer-group-${group.id}`
        const name = `Đáp án ${groupIndex + 1} của ${qName}`
        if (!group.answerType) return add(id, `${name} chưa chọn dạng đáp án.`)
        if (!group.answers?.length) add(id, `${name} phải có ít nhất 1 nội dung đáp án.`)
        if (group.answerType === 'CHOICE' && group.answers.length < 2) add(id, `${name} trắc nghiệm phải có ít nhất 2 phương án.`)

        group.answers?.forEach((answer, answerIndex) => {
          if (!hasText(answer.content) && !answer.imageFile && !answer.audioFile) add(id, `Phương án ${answerIndex + 1} của ${name} chưa có nội dung, ảnh hoặc audio.`)
        })

        if (group.answerType === 'CHOICE' || group.answerType === 'TRUE_FALSE') {
          if (!group.answers?.some((answer) => answer.isCorrect)) add(id, `${name} phải có ít nhất 1 đáp án đúng.`)
        }

        if (group.answerType === 'TRUE_FALSE' && group.scoreByCorrectCount) {
          const rules = group.scoringRules ?? []
          if (!rules.length) add(id, `${name} đã bật chấm theo số câu đúng nhưng chưa có quy luật chấm.`)
          const seen = new Set()
          rules.forEach((rule) => {
            const count = numeric(rule.correctCount)
            const point = numeric(rule.point)
            if (!Number.isInteger(count) || count < 0) add(id, `${name}: số câu đúng trong quy luật phải là số nguyên từ 0 trở lên.`)
            if (count > group.answers.length) add(id, `${name}: số câu đúng trong quy luật không được vượt quá ${group.answers.length}.`)
            if (seen.has(count)) add(id, `${name}: không được có 2 quy luật cùng số câu đúng là ${count}.`)
            seen.add(count)
            if (!Number.isFinite(point) || point < 0) add(id, `${name}: điểm của quy luật phải từ 0 trở lên.`)
            if (Number.isFinite(point) && point > numeric(question.point)) add(id, `${name}: điểm quy luật không được vượt quá điểm của câu hỏi (${question.point}đ).`)
          })
        }
      })
    })
  })

  return { errors, firstErrorId, isValid: Object.keys(errors).length === 0 }
}
