export function getPriorityLabel(level) {
  const labels = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
  }

  return labels[level] || 'Unknown'
}
