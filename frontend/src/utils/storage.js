export function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getFromStorage(key) {
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : null
}

export function removeFromStorage(key) {
  localStorage.removeItem(key)
}
