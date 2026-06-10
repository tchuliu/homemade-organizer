const recentHomesKey = 'homemade-organizer:recent-homes'
const maxRecentHomes = 5

export function loadRecentHomes() {
  try {
    const savedHomes = JSON.parse(localStorage.getItem(recentHomesKey) || '[]')
    return Array.isArray(savedHomes) ? savedHomes.slice(0, maxRecentHomes) : []
  } catch (err) {
    return []
  }
}

export function saveRecentHome(home) {
  if (!home?.id) return

  const recentHomes = loadRecentHomes()
  const nextHome = {
    id: home.id,
    name: home.name || `Home ${home.id.slice(0, 8)}`,
    accessedAt: new Date().toISOString(),
  }
  const nextHomes = [nextHome, ...recentHomes.filter((savedHome) => savedHome.id !== home.id)]

  localStorage.setItem(recentHomesKey, JSON.stringify(nextHomes.slice(0, maxRecentHomes)))
}

export function parseHomeId(value) {
  const trimmedValue = value.trim()
  if (!trimmedValue) return ''

  try {
    const url = new URL(trimmedValue)
    const homeIndex = url.pathname.split('/').findIndex((part) => part === 'home')
    if (homeIndex >= 0) return url.pathname.split('/')[homeIndex + 1] || ''
  } catch (err) {
    // Not a full URL, so treat it as a raw home ID below.
  }

  return trimmedValue.replace(/^\/?home\//, '').replace(/^\//, '')
}
