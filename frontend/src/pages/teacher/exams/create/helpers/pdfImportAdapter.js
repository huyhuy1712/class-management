export function validatePdfImport(file, examNumber) {
  if (
    !file ||
    !/\.pdf$/i.test(file.name) ||
    (file.type && file.type !== 'application/pdf')
  ) {
    return 'Vui lòng chọn một file PDF.'
  }

  if (!file.size || file.size > 10 * 1024 * 1024) {
    return 'File PDF phải có dung lượng từ 1 byte đến 10 MiB.'
  }

  const number = Number(examNumber)
  if (
    !/^\d+$/.test(String(examNumber)) ||
    !Number.isSafeInteger(number) ||
    number < 1 ||
    number > 2147483647
  ) {
    return 'Vui lòng nhập số thứ tự của đề muốn chọn (ví dụ: 2 để chọn Đề 2).'
  }

  return ''
}

export function pdfImportSections(preview) {
  const sections = preview?.structure?.sections
  if (!sections?.length) {
    throw new Error('Không có nội dung đề để mở. Vui lòng kiểm tra lỗi import.')
  }

  return sections.map((section, sectionIndex) => ({
    id: section.clientId,
    title: section.rawTitle || `Phần ${sectionIndex + 1}`,
    paragraph: section.rawIntroduction || '',
    orderIndex: sectionIndex + 1,
    questions: section.questions.map((question, questionIndex) => {
      const group = question.group

      if (
        !['SINGLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(
          group?.answerType
        )
      ) {
        throw new Error('Preview chứa kiểu câu hỏi chưa hỗ trợ.')
      }

      return {
        id: question.clientId,
        content: question.rawStem || question.rawText || '',
        explanation: question.explanation || '',
        point: '',
        orderIndex: questionIndex + 1,
        answerGroups: [
          {
            id: group.clientId,
            answerType:
              group.answerType === 'SINGLE_CHOICE'
                ? 'CHOICE'
                : group.answerType,
            choiceMode: 'SINGLE',
            orderIndex: 1,
            scoreByCorrectCount: false,
            scoringRules: [],
            answers:
              group.answerType === 'SHORT_ANSWER'
                ? [
                    {
                      id: `${group.clientId}-text`,
                      content: group.correctAnswerText ?? '',
                      point: '',
                      orderIndex: 1,
                    },
                  ]
                : (group.options ?? []).map((option, optionIndex) => ({
                    id: option.clientId,
                    content: option.rawText ?? '',
                    isCorrect: option.isCorrect,
                    point: '',
                    orderIndex: optionIndex + 1,
                  })),
          },
        ],
      }
    }),
  }))
}

export function importIllustrationTargets(sections, assets, selectedIds) {
  return selectedIds.map((assetId) => {
    const asset = assets.find(
      (item) => item.id === assetId && item.purpose === 'ILLUSTRATION'
    )
    if (!asset) {
      throw new Error('Ảnh import không còn hợp lệ. Vui lòng chọn lại.')
    }

    for (const [sectionIndex, section] of sections.entries()) {
      for (const [questionIndex, question] of section.questions.entries()) {
        if (
          ['QUESTION', 'EXPLANATION'].includes(asset.owner) &&
          question.id === asset.ownerId
        ) {
          return { assetId, sectionIndex, questionIndex }
        }

        if (asset.owner === 'OPTION') {
          for (const [answerIndex, group] of question.answerGroups.entries()) {
            const optionIndex = group.answers.findIndex(
              (option) => option.id === asset.ownerId
            )
            if (optionIndex >= 0) {
              return {
                assetId,
                sectionIndex,
                questionIndex,
                answerIndex,
                optionIndex,
              }
            }
          }
        }
      }
    }

    throw new Error(
      'Một ảnh đã chọn thuộc câu/phương án đã xóa. Vui lòng bỏ chọn ảnh đó trước khi lưu.'
    )
  })
}
