import {
  importantDateTypes,
  priorityOptions,
  subjectOptions,
} from '../data/sampleData'
import { todayIso } from './helpers'
import { generateWeeklyPlan } from './planGenerator'

const DEFAULT_SUBJECT = subjectOptions.includes('General') ? 'General' : subjectOptions[0]
const IMPORTANT_DATE_KEYWORDS = /\b(quiz|test|assessment|project|field trip|picture day|concert|event|reminder)\b/i
const ASSESSMENT_KEYWORDS = /\b(quiz|test|assessment)\b/i
const ASSIGNMENT_KEYWORDS = /\b(worksheet|practice|homework|phonics|sight word|reading|paragraph|comprehension|fraction|multiplication|vocabulary|write|study|review|complete)\b/i
const DATE_PATTERN = /\b(?:mon|tues|wednes|thurs|fri|satur|sun)?(?:day)?\s*(\d{1,2}\/\d{1,2})\b/gi
const SUBJECT_PATTERNS = [
  { label: 'Math', pattern: /\b(math|accelerated math|fractions?|multiplication|division|number talk)\b/i },
  { label: 'Reading', pattern: /\b(reading|language arts|ela|comprehension|phonics|sight words?|vocabulary)\b/i },
  { label: 'Science', pattern: /\b(science|stem|experiment|life science|earth science)\b/i },
  { label: 'Writing', pattern: /\b(writing|paragraph|essay|opinion writing|response)\b/i },
  { label: 'History', pattern: /\b(history|social studies|va studies|virginia studies)\b/i },
  { label: 'Art', pattern: /\b(art|sketch|draw|paint)\b/i },
  { label: 'Music', pattern: /\b(music|chorus|recorder)\b/i },
  { label: 'Spanish', pattern: /\b(spanish|vocabulario)\b/i },
]

function createDraftId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`
}

function formatMonthDayToIso(token) {
  const match = token.match(/(\d{1,2})\/(\d{1,2})/)
  if (!match) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = String(Number(match[1])).padStart(2, '0')
  const day = String(Number(match[2])).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function collapseWhitespace(value = '') {
  return value.replace(/\s+/g, ' ').trim()
}

function cleanSuggestionTitle(text) {
  return collapseWhitespace(
    text
      .replace(DATE_PATTERN, '')
      .replace(/\b(quiz|test|assessment|project|event|reminder)\b\s*[:-]?/gi, (match) => match.trim())
      .replace(/^[\s\-:|]+|[\s\-:|]+$/g, ''),
  )
}

function detectChildId(text, children, defaultChildId) {
  const lower = text.toLowerCase()
  const match = children.find(
    (child) =>
      child.name.toLowerCase().includes(lower) ||
      lower.includes(child.name.split(' ')[0].toLowerCase()),
  )
  return match?.id ?? defaultChildId
}

function detectImportantDateType(text) {
  const lower = text.toLowerCase()
  if (/test|assessment/.test(lower)) return 'Test'
  if (/quiz/.test(lower)) return 'Quiz'
  if (/project/.test(lower)) return 'Project'
  if (/field trip/.test(lower)) return 'Field Trip'
  if (/picture day/.test(lower)) return 'Picture Day'
  if (/event|concert/.test(lower)) return 'Event'
  if (/reminder/.test(lower)) return 'Reminder'
  return ''
}

function inferSubject(text, contextSubject = '') {
  const line = text.toLowerCase()
  const directMatch = SUBJECT_PATTERNS.find(({ pattern }) => pattern.test(line))
  if (directMatch) return directMatch.label
  if (contextSubject) return contextSubject
  return DEFAULT_SUBJECT
}

function looksLikeHeading(line) {
  if (line.length > 40) return false
  return SUBJECT_PATTERNS.some(({ pattern }) => pattern.test(line)) && !/[.!?]/.test(line)
}

function extractDateTokens(line) {
  return [...line.matchAll(DATE_PATTERN)].map((match) => ({
    token: match[1],
    index: match.index ?? 0,
    iso: formatMonthDayToIso(match[1]),
  }))
}

function findNearbyDate(line, neighborLine = '') {
  const ownDates = extractDateTokens(line)
  if (ownDates[0]?.iso) return { date: ownDates[0].iso, confidenceBoost: 0.2 }

  const neighborDates = extractDateTokens(neighborLine)
  if (neighborDates[0]?.iso) return { date: neighborDates[0].iso, confidenceBoost: 0.05 }

  return { date: '', confidenceBoost: 0 }
}

function getConfidenceLevel(score) {
  if (score >= 0.82) return 'high'
  if (score >= 0.58) return 'medium'
  return 'low'
}

function buildSuggestion({
  childId,
  category,
  title,
  subject = DEFAULT_SUBJECT,
  type = '',
  date = '',
  notes = '',
  confidenceScore = 0.5,
  sourceLine = '',
}) {
  return {
    id: createDraftId('weekly-import-suggestion'),
    childId,
    category,
    subject,
    type,
    title,
    date,
    notes,
    sourceLine,
    confidence: getConfidenceLevel(confidenceScore),
  }
}

function dedupeSuggestions(suggestions) {
  const seen = new Set()

  return suggestions.filter((item) => {
    const signature = [
      item.category,
      item.childId,
      item.title.trim().toLowerCase(),
      item.date,
      item.type,
      item.subject,
    ].join('::')

    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
}

function createUnmatchedLine(line, childId, subject = DEFAULT_SUBJECT) {
  return {
    id: createDraftId('weekly-import-unmatched'),
    childId,
    category: '',
    subject,
    type: '',
    title: collapseWhitespace(line),
    date: '',
    notes: 'Needs review before import.',
    sourceLine: collapseWhitespace(line),
    confidence: 'low',
  }
}

export function createEmptyImportSuggestion(childId, category = 'Assignment') {
  return {
    id: createDraftId('weekly-import-suggestion'),
    childId,
    category,
    subject: DEFAULT_SUBJECT,
    type: category === 'Important Date' ? importantDateTypes[0] : '',
    title: '',
    date: todayIso(),
    notes: '',
    sourceLine: '',
    confidence: 'manual',
  }
}

export function createEmptyImportAssignment(childId) {
  return createEmptyImportSuggestion(childId, 'Assignment')
}

export function createEmptyImportImportantDate(childId) {
  return createEmptyImportSuggestion(childId, 'Important Date')
}

export function analyzeWeeklyImport({
  text = '',
  fileName = '',
  children = [],
  selectedChildId = '',
  defaultChildId = '',
  weekOf = todayIso(),
}) {
  const lines = `${fileName}\n${text}`
    .split(/\r?\n/)
    .map((line) => collapseWhitespace(line))
    .filter(Boolean)

  const suggestionChips = new Set()
  const suggestedAssignments = []
  const suggestedImportantDates = []
  const unmatchedLines = []
  let detectedDates = 0
  let detectedAssessments = 0
  let contextSubject = ''
  let contextLineIndex = -10

  lines.forEach((line, index) => {
    const lower = line.toLowerCase()
    const childId = selectedChildId || detectChildId(line, children, defaultChildId)
    const ownSubject = inferSubject(line, '')

    if (looksLikeHeading(line)) {
      contextSubject = ownSubject
      contextLineIndex = index
      if (contextSubject) suggestionChips.add(contextSubject)
      return
    }

    const activeSubject = index - contextLineIndex <= 2 ? contextSubject : ''
    const subject = inferSubject(line, activeSubject)
    const nearbyDate = findNearbyDate(line, lines[index + 1] ?? '')
    const lineDates = extractDateTokens(line)

    if (lineDates.length > 0) {
      detectedDates += lineDates.length
      lineDates.forEach((match) => suggestionChips.add(match.token))
    }

    if (/quiz/.test(lower)) suggestionChips.add('quiz')
    if (/test/.test(lower)) suggestionChips.add('test')
    if (/assessment/.test(lower)) suggestionChips.add('assessment')

    const title = cleanSuggestionTitle(line)
    if (!title || title.length < 4) return

    if (IMPORTANT_DATE_KEYWORDS.test(lower)) {
      const type = detectImportantDateType(line)
      const confidenceScore = 0.65 + nearbyDate.confidenceBoost + (type ? 0.1 : 0)

      if (ASSESSMENT_KEYWORDS.test(lower)) detectedAssessments += 1

      suggestedImportantDates.push(
        buildSuggestion({
          childId,
          category: 'Important Date',
          subject,
          type,
          title,
          date: nearbyDate.date,
          notes: 'Suggested from extracted teacher text.',
          sourceLine: line,
          confidenceScore,
        }),
      )
      return
    }

    if (ASSIGNMENT_KEYWORDS.test(lower) || activeSubject) {
      const confidenceScore = 0.45 + (ASSIGNMENT_KEYWORDS.test(lower) ? 0.18 : 0) + (activeSubject ? 0.12 : 0) + nearbyDate.confidenceBoost

      suggestedAssignments.push(
        buildSuggestion({
          childId,
          category: 'Assignment',
          subject,
          title,
          date: confidenceScore >= 0.7 ? nearbyDate.date : '',
          notes: 'Suggested from extracted teacher text.',
          sourceLine: line,
          confidenceScore,
        }),
      )
      return
    }

    if (line.length >= 8) {
      unmatchedLines.push(createUnmatchedLine(line, childId, subject))
    }
  })

  return {
    suggestions: dedupeSuggestions([...suggestedAssignments, ...suggestedImportantDates]).slice(0, 12),
    unmatchedLines: dedupeSuggestions(unmatchedLines).slice(0, 10),
    summary: {
      detectedDates,
      detectedAssessments,
      suggestionChips: Array.from(suggestionChips).slice(0, 8),
      suggestedAssignments: suggestedAssignments.length,
      suggestedImportantDates: suggestedImportantDates.length,
      unmatchedLines: unmatchedLines.length,
      suggestionCount: suggestedAssignments.length + suggestedImportantDates.length,
    },
  }
}

export function splitWeeklyImportSuggestions(suggestions = []) {
  return {
    assignments: suggestions.filter((item) => item.category === 'Assignment'),
    importantDates: suggestions.filter((item) => item.category === 'Important Date'),
    unmatchedLines: suggestions.filter((item) => !item.category),
  }
}

export function getValidWeeklyImportEntries(suggestions = []) {
  const normalizedSuggestions = suggestions.filter(Boolean)

  return {
    assignments: normalizedSuggestions
      .filter((item) => item.category === 'Assignment' && item.childId && item.title.trim() && item.date)
      .map((item) => ({
        childId: item.childId,
        subject: item.subject || DEFAULT_SUBJECT,
        title: item.title.trim(),
        dueDate: item.date,
        priority: priorityOptions.includes(item.priority) ? item.priority : priorityOptions[1],
        status: 'Not Started',
        notes: item.notes.trim(),
      })),
    importantDates: normalizedSuggestions
      .filter((item) => item.category === 'Important Date' && item.childId && item.title.trim() && item.date && item.type)
      .map((item) => ({
        childId: item.childId,
        type: item.type,
        title: item.title.trim(),
        date: item.date,
        notes: item.notes.trim(),
      })),
  }
}

function getAssignmentSignature(item) {
  return [item.childId, item.title.trim().toLowerCase(), item.dueDate].join('::')
}

function getImportantDateSignature(item) {
  return [item.childId, item.title.trim().toLowerCase(), item.date].join('::')
}

export function mergeImportedWeek({
  selectedChildId = '',
  draftedAssignments = [],
  draftedImportantDates = [],
  currentAssignments = [],
  currentImportantDates = [],
  currentPlannerTasks = [],
  children = [],
  createId,
}) {
  const normalizedAssignments = draftedAssignments.map((item) => ({
    id: createId('assignment'),
    childId: item.childId || selectedChildId,
    subject: item.subject || DEFAULT_SUBJECT,
    title: item.title.trim(),
    dueDate: item.dueDate,
    priority: item.priority,
    status: item.status ?? 'Not Started',
    notes: item.notes.trim(),
  }))

  const normalizedImportantDates = draftedImportantDates.map((item) => ({
    id: createId('date'),
    childId: item.childId || selectedChildId,
    type: item.type,
    title: item.title.trim(),
    date: item.date,
    notes: item.notes.trim(),
  }))

  const existingAssignmentKeys = new Set(currentAssignments.map(getAssignmentSignature))
  const existingImportantDateKeys = new Set(currentImportantDates.map(getImportantDateSignature))

  const assignmentsToAdd = normalizedAssignments.filter((item) => {
    const signature = getAssignmentSignature(item)
    if (existingAssignmentKeys.has(signature)) return false
    existingAssignmentKeys.add(signature)
    return true
  })

  const importantDatesToAdd = normalizedImportantDates.filter((item) => {
    const signature = getImportantDateSignature(item)
    if (existingImportantDateKeys.has(signature)) return false
    existingImportantDateKeys.add(signature)
    return true
  })

  const nextAssignments = [...assignmentsToAdd, ...currentAssignments]
  const nextImportantDates = [...importantDatesToAdd, ...currentImportantDates]
  const manualPlannerTasks = currentPlannerTasks.filter((task) => task.generatedBy !== 'weekly-plan')
  const generatedPlannerTasks = generateWeeklyPlan({
    assignments: nextAssignments,
    importantDates: nextImportantDates,
    children,
    plannerTasks: currentPlannerTasks,
  })

  return {
    assignments: assignmentsToAdd,
    importantDates: importantDatesToAdd,
    assignmentsToAdd,
    importantDatesToAdd,
    nextAssignments,
    nextImportantDates,
    plannerTasks: [...generatedPlannerTasks, ...manualPlannerTasks],
  }
}

export function buildWeeklyImportPreview({
  selectedChildId = '',
  currentAssignments = [],
  currentImportantDates = [],
  currentPlannerTasks = [],
  importAssignments = [],
  importImportantDates = [],
  children = [],
}) {
  return mergeImportedWeek({
    selectedChildId,
    draftedAssignments: importAssignments,
    draftedImportantDates: importImportantDates,
    currentAssignments,
    currentImportantDates,
    currentPlannerTasks,
    children,
    createId: createDraftId,
  })
}
