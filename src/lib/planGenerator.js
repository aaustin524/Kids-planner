const PLANNING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday']
const TIME_SLOTS = ['4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM']
const TEST_EVENT_TYPES = new Set(['Test', 'Quiz'])
const SUBJECT_KEYWORDS = [
  ['Math', ['math', 'multiplication', 'division', 'fractions', 'algebra', 'geometry']],
  ['Reading', ['reading', 'book', 'novel', 'literature', 'vocabulary', 'spelling']],
  ['Science', ['science', 'lab', 'experiment', 'volcano', 'biology', 'chemistry']],
  ['Writing', ['writing', 'essay', 'draft', 'journal', 'paragraph', 'revision']],
  ['History', ['history', 'social studies', 'chapter', 'civics']],
  ['Art', ['art', 'drawing', 'paint', 'craft']],
  ['Music', ['music', 'band', 'choir', 'practice']],
  ['Spanish', ['spanish', 'vocabulario', 'language']],
]

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayIso() {
  return formatLocalDate(new Date())
}

function parseIsoDate(value) {
  if (!value || typeof value !== 'string') return null
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function addDays(date, count) {
  const next = new Date(date)
  next.setDate(date.getDate() + count)
  return next
}

function buildPlanningWeek() {
  const today = parseIsoDate(todayIso()) ?? new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? 1 : day >= 5 ? 8 - day : 1 - day
  const monday = addDays(today, diffToMonday)

  return PLANNING_DAYS.map((label, index) => {
    const date = addDays(monday, index)
    return {
      day: label,
      iso: formatLocalDate(date),
    }
  })
}

function getAvailableDays(week, dueDate) {
  const startIso = todayIso()
  const finalIso = dueDate && dueDate < week[week.length - 1].iso ? dueDate : week[week.length - 1].iso
  const upcoming = week.filter((day) => day.iso >= startIso && day.iso <= finalIso)

  if (upcoming.length > 0) return upcoming

  const thisWeekOnly = week.filter((day) => day.iso <= finalIso)
  if (thisWeekOnly.length > 0) return [thisWeekOnly[thisWeekOnly.length - 1]]

  const fallback = week.find((day) => day.iso >= startIso) ?? week[week.length - 1]
  return fallback ? [fallback] : []
}

function getSessionCount(priority) {
  if (priority === 'High') return 3
  if (priority === 'Medium') return 2
  return 1
}

function getPrepCount(type) {
  if (type === 'Test') return 3
  if (type === 'Quiz') return 2
  if (type === 'Project') return 2
  return 1
}

function inferSubject(...values) {
  const haystack = values.join(' ').toLowerCase()
  const match = SUBJECT_KEYWORDS.find(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
  return match?.[0] ?? 'Reading'
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function createGeneratedId({ childId, day, sourceId, sourceType, title, category, index }) {
  return [
    'planner',
    'generated',
    sourceType,
    sourceId,
    childId,
    day.toLowerCase(),
    category,
    index + 1,
    slugify(title) || 'task',
  ].join('-')
}

function createDayLoadTracker(week, plannerTasks = []) {
  const state = new Map(
    week.map((entry) => [
      entry.day,
      {
        ...entry,
        load: 0,
        taskCount: 0,
        slotIndex: 0,
      },
    ]),
  )

  plannerTasks.forEach((task) => {
    const dayState = state.get(task.day)
    if (!dayState) return
    dayState.taskCount += 1
    dayState.slotIndex += 1
    dayState.load += task.isGenerated ? 0.9 : 1
  })

  return state
}

function chooseBestDay(availableDays, dayStateByDay, preferredIndex = 0) {
  if (availableDays.length === 0) return null

  return [...availableDays].sort((a, b) => {
    const aState = dayStateByDay.get(a.day)
    const bState = dayStateByDay.get(b.day)
    if (!aState || !bState) return 0
    if (aState.load !== bState.load) return aState.load - bState.load
    if (aState.taskCount !== bState.taskCount) return aState.taskCount - bState.taskCount

    const aIndex = PLANNING_DAYS.indexOf(a.day)
    const bIndex = PLANNING_DAYS.indexOf(b.day)
    const aDistance = Math.abs(aIndex - preferredIndex)
    const bDistance = Math.abs(bIndex - preferredIndex)
    if (aDistance !== bDistance) return aDistance - bDistance
    return aIndex - bIndex
  })[0]
}

function reserveDaySlot(dayStateByDay, day, weight) {
  const dayState = dayStateByDay.get(day)
  if (!dayState) return ''

  const time = TIME_SLOTS[dayState.slotIndex % TIME_SLOTS.length]
  dayState.slotIndex += 1
  dayState.taskCount += 1
  dayState.load += weight
  return time
}

function createTask({
  dayStateByDay,
  childId,
  day,
  subject,
  title,
  notes,
  sourceId,
  sourceType,
  category,
  weight,
  index,
}) {
  return {
    id: createGeneratedId({ childId, day, sourceId, sourceType, title, category, index }),
    childId,
    day,
    subject,
    time: reserveDaySlot(dayStateByDay, day, weight),
    title,
    notes,
    isGenerated: true,
    generatedBy: 'weekly-plan',
    category,
    sourceId,
    sourceType,
  }
}

function buildAssignmentTasks(assignments, week, dayStateByDay) {
  return assignments
    .filter((assignment) => assignment.status !== 'Done')
    .flatMap((assignment) => {
      const availableDays = getAvailableDays(week, assignment.dueDate)
      const totalSessions = getSessionCount(assignment.priority)
      const dayIndexes = availableDays.map((day) => PLANNING_DAYS.indexOf(day.day)).filter((index) => index >= 0)
      const preferredBase = dayIndexes.length > 0 ? Math.max(0, Math.round(dayIndexes.reduce((sum, value) => sum + value, 0) / dayIndexes.length)) : 0

      return Array.from({ length: totalSessions }, (_, index) => {
        const preferredIndex = Math.max(0, preferredBase - (totalSessions - index - 1))
        const targetDay = chooseBestDay(availableDays, dayStateByDay, preferredIndex)
        if (!targetDay) return null

        const isFinalSession = index === totalSessions - 1
        const sessionLabel =
          totalSessions === 1
            ? `Work on ${assignment.title}`
            : isFinalSession
              ? `Final review for ${assignment.title}`
              : `Prep ${index + 1} for ${assignment.title}`

        return createTask({
          dayStateByDay,
          childId: assignment.childId,
          day: targetDay.day,
          subject: assignment.subject,
          title: sessionLabel,
          notes: `Due ${assignment.dueDate}${assignment.priority === 'High' ? ' • high-priority assignment' : ''}`,
          sourceId: assignment.id,
          sourceType: 'assignment',
          category: 'assignment-prep',
          weight: assignment.priority === 'High' ? 1.3 : assignment.priority === 'Medium' ? 1.05 : 0.9,
          index,
        })
      }).filter(Boolean)
    })
}

function buildImportantDateTasks(importantDates, week, dayStateByDay) {
  return importantDates
    .filter((item) => item.date >= todayIso())
    .flatMap((item) => {
      const subject = inferSubject(item.title, item.notes, item.type)
      const availableDays = getAvailableDays(week, item.date)
      const totalSessions = getPrepCount(item.type)
      const dayIndexes = availableDays.map((day) => PLANNING_DAYS.indexOf(day.day)).filter((index) => index >= 0)
      const preferredBase = dayIndexes.length > 0 ? Math.max(0, Math.round(dayIndexes.reduce((sum, value) => sum + value, 0) / dayIndexes.length)) : 0

      return Array.from({ length: totalSessions }, (_, index) => {
        const preferredIndex = Math.max(0, preferredBase - (totalSessions - index - 1))
        const targetDay = chooseBestDay(availableDays, dayStateByDay, preferredIndex)
        if (!targetDay) return null

        const isAssessment = TEST_EVENT_TYPES.has(item.type)
        const title = isAssessment
          ? `${item.type} prep ${index + 1}: ${item.title}`
          : index === totalSessions - 1
            ? `Ready for ${item.title}`
            : `Prep for ${item.title}`

        return createTask({
          dayStateByDay,
          childId: item.childId,
          day: targetDay.day,
          subject,
          title,
          notes: `${item.type} on ${item.date}${item.notes ? ` • ${item.notes}` : ''}`,
          sourceId: item.id,
          sourceType: 'important-date',
          category: isAssessment ? 'assessment-prep' : 'event-prep',
          weight: isAssessment ? 1.15 : 0.95,
          index,
        })
      }).filter(Boolean)
    })
}

function buildReadingTasks(children, week, dayStateByDay) {
  const readingDays = week.filter((day) => day.iso >= todayIso())

  return children.flatMap((child) => {
    const totalSessions = Math.min(3, Math.max(2, readingDays.length))
    const minutes = Math.max(15, Math.min(30, Math.round((Number(child.readingGoalMinutes) || 60) / 5)))

    return Array.from({ length: totalSessions }, (_, index) => {
      const targetDay = chooseBestDay(readingDays, dayStateByDay, index)
      if (!targetDay) return null

      return createTask({
        dayStateByDay,
        childId: child.id,
        day: targetDay.day,
        subject: 'Reading',
        title: `${minutes}-minute reading session`,
        notes: `Independent reading block for ${child.name}.`,
        sourceId: child.id,
        sourceType: 'reading-routine',
        category: 'reading-session',
        weight: 0.65,
        index,
      })
    }).filter(Boolean)
  })
}

function dedupeTasks(tasks) {
  const seen = new Set()

  return tasks.filter((task) => {
    if (seen.has(task.id)) return false
    seen.add(task.id)
    return true
  })
}

export function generateWeeklyPlan({ assignments = [], importantDates = [], children = [], plannerTasks = [] }) {
  const week = buildPlanningWeek()
  const manualPlannerTasks = plannerTasks.filter((task) => task.generatedBy !== 'weekly-plan')
  const dayStateByDay = createDayLoadTracker(week, manualPlannerTasks)
  const generatedTasks = [
    ...buildAssignmentTasks(assignments, week, dayStateByDay),
    ...buildImportantDateTasks(importantDates, week, dayStateByDay),
    ...buildReadingTasks(children, week, dayStateByDay),
  ]

  return dedupeTasks(generatedTasks)
}
