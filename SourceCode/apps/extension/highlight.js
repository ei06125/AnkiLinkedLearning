export function highlightTranscriptTarget(target) {
  const attribute = 'data-ankilinkedlearning-highlight';
  for (const mark of document.querySelectorAll(`[${attribute}]`)) {
    const parent = mark.parentNode;
    mark.replaceWith(document.createTextNode(mark.textContent || ''));
    parent?.normalize();
  }
  const transcript = document.querySelector('.classroom-transcript__lines');
  if (!transcript || !target) return 0;
  let count = 0;
  for (const line of transcript.querySelectorAll('.content-transcript-line')) {
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const text = node.nodeValue || '';
      if (!text.includes(target)) continue;
      const fragment = document.createDocumentFragment();
      text.split(target).forEach((part, index) => {
        if (index) {
          const mark = document.createElement('mark');
          mark.setAttribute(attribute, '');
          mark.style.background = '#f5d76e';
          mark.style.color = 'inherit';
          mark.style.borderRadius = '3px';
          mark.textContent = target;
          fragment.append(mark);
          count += 1;
        }
        fragment.append(document.createTextNode(part));
      });
      node.replaceWith(fragment);
    }
  }
  return count;
}
