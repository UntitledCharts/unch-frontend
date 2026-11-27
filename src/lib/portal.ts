// Moves an element to the end of <body> while it's mounted, so menus aren't clipped or covered by
// the boxes they're opened from (overflow, stacking contexts, backdrop filters).
export function portal(node: HTMLElement) {
  document.body.appendChild(node);
  return {
    destroy() {
      node.remove();
    },
  };
}
