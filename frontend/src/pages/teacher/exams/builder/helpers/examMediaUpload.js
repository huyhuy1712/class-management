const mediaTypes = {
  image: { type: 'IMAGE', extensions: /\.(jpe?g|png|webp)$/i, mime: ['image/jpeg', 'image/png', 'image/webp'], max: 5 * 1024 * 1024 },
  audio: { type: 'AUDIO', extensions: /\.mp3$/i, mime: ['audio/mpeg'], max: 8 * 1024 * 1024 },
}

export function getExamMediaNodes(sections) {
  return sections.flatMap((section) => [section, ...section.questions.flatMap((question) => [
    question, ...question.answerGroups.flatMap((group) => group.answers),
  ])])
}

export function validateExamMedia(sections) {
  const nodes = getExamMediaNodes(sections)
  let count = 0
  for (const node of nodes) {
    for (const [kind, config] of Object.entries(mediaTypes)) {
      const file = node[`${kind}File`]
      if (file || node[`${kind}Media`]) count++
      if (!file) continue
      if (!config.extensions.test(file.name) || !config.mime.includes(file.type) || !file.size || file.size > config.max) {
        throw new Error(kind === 'image' ? 'Ảnh phải là JPEG, PNG hoặc WebP, tối đa 5 MiB.' : 'Audio phải là MP3, tối đa 8 MiB.')
      }
    }
  }
  if (count > 500) throw new Error('Đề thi không được vượt quá 500 media.')
}

export async function uploadExamMedia(sections, draftToken, onProgress, upload) {
  const copySections = (items) => items.map((section) => ({
    ...section, questions: section.questions.map((question) => ({
      ...question, answerGroups: question.answerGroups.map((group) => ({
        ...group, answers: group.answers.map((item) => ({ ...item })),
      })),
    })),
  }))
  const prepared = copySections(sections)
  for (const node of getExamMediaNodes(prepared)) {
    for (const [kind, config] of Object.entries(mediaTypes)) {
      const file = node[`${kind}File`]
      if (!file) continue
      const result = await upload(draftToken, config.type, file)
      node[`${kind}Media`] = { ...result, name: file.name }
      node[`${kind}File`] = null
      // Each successful upload survives a later failed upload or page reload.
      onProgress(copySections(prepared))
    }
  }
  return prepared
}
