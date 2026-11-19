/** Helper DOM kecil untuk komponen (tanpa innerHTML). */

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function clear(node) {
  if (node) node.replaceChildren();
}
