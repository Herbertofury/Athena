// Append immutable event snapshots without serializing the entire history again.
export function formatEventChunk(value, index) {
  if (!Number.isSafeInteger(index) || index < 0) throw new TypeError('Invalid event index');
  const json = JSON.stringify(value, null, 2);
  if (json === undefined) throw new TypeError('Event must be JSON serializable');
  return (index ? ',\n' : '\n') + json.replace(/^/gm, '  ');
}
export function createEventLogView(element) {
  const doc = element.ownerDocument;
  const opening = doc.createTextNode('['), closing = doc.createTextNode(']');
  element.replaceChildren(opening, closing);
  let count = 0;
  return {
    append(value) {
      const chunk = formatEventChunk(value, count);
      // Only text nodes: provider text never becomes executable markup.
      element.insertBefore(doc.createTextNode(chunk), closing);
      if (count === 0) closing.data = '\n]';
      count += 1;
    },
    get count() { return count; },
  };
}
