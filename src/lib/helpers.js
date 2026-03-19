export const subjectThemeMap = {
  Math: 'bg-sky/15 text-sky border-sky/25',
  Reading: 'bg-coral/15 text-coral border-coral/25',
  Science: 'bg-mint/20 text-teal-700 border-mint/40',
  Writing: 'bg-apricot/25 text-orange-700 border-apricot/40',
  History: 'bg-plum/15 text-plum border-plum/25',
  Art: 'bg-sunflower/25 text-amber-700 border-sunflower/40',
  Music: 'bg-rose-100 text-rose-700 border-rose-200',
  Spanish: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export const childThemeMap = {
  coral: {
    gradient: 'from-coral to-apricot',
    badge: 'bg-coral/15 text-coral border-coral/25',
    progress: 'bg-coral',
  },
  sky: {
    gradient: 'from-sky to-mint',
    badge: 'bg-sky/15 text-sky border-sky/25',
    progress: 'bg-sky',
  },
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ')
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function parseDateValue(dateString) {
  if (!dateString || typeof dateString !== 'string') return null
  const parsed = new Date(`${dateString}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(dateString) {
  const parsed = parseDateValue(dateString)
  if (!parsed) return 'Date unavailable'

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function isOverdue(dateString, status) {
  if (!parseDateValue(dateString)) return false
  return status !== 'Done' && dateString < todayIso()
}

export function isDueSoon(dateString, status) {
  if (status === 'Done') return false
  if (!parseDateValue(dateString)) return false
  const now = new Date(`${todayIso()}T00:00:00`)
  const due = new Date(`${dateString}T00:00:00`)
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 3
}

export function getWeekRange(dateString) {
  const date = parseDateValue(dateString)
  if (!date) return todayIso()
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diffToMonday)
  return monday.toISOString().slice(0, 10)
}

export function sumReadingMinutes(logs, childId) {
  return logs
    .filter((entry) => !childId || entry.childId === childId)
    .reduce((total, entry) => total + Number(entry.minutesRead), 0)
}

export function getWeekdayLabel(dateString) {
  const parsed = parseDateValue(dateString)
  if (!parsed) return 'Monday'

  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
  })
}

export function getCurrentWeekDates() {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'long' }),
      iso: date.toISOString().slice(0, 10),
      isToday: date.toISOString().slice(0, 10) === todayIso(),
    }
  })
}

export function compareTimeLabels(a, b) {
  const parse = (value) => {
    if (!value) return Number.MAX_SAFE_INTEGER
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return Number.MAX_SAFE_INTEGER
    let hours = Number(match[1]) % 12
    const minutes = Number(match[2])
    const meridiem = match[3].toUpperCase()
    if (meridiem === 'PM') hours += 12
    return hours * 60 + minutes
  }

  return parse(a) - parse(b)
}
