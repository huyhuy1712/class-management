export function optimisticEmojiReactions(reactions = [], previousEmoji, nextEmoji) {
  const updated = new Map(reactions.map((reaction) => [reaction.emojiCode, { ...reaction }]))
  if (previousEmoji) {
    const previous = updated.get(previousEmoji)
    if (previous?.count <= 1) updated.delete(previousEmoji)
    else if (previous) updated.set(previousEmoji, { ...previous, count: previous.count - 1, reactedByMe: false })
  }
  if (nextEmoji) {
    const next = updated.get(nextEmoji)
    updated.set(nextEmoji, next
      ? { ...next, count: next.count + 1, reactedByMe: true }
      : { emojiCode: nextEmoji, count: 1, reactedByMe: true })
  }
  return [...updated.values()]
}
