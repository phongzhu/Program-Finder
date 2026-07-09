export function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

export function mergeStyles(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}
