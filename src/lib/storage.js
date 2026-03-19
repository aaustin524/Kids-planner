import {
  importantDateTypes,
  priorityOptions,
  sampleData,
  statusOptions,
  subjectOptions,
  weekdayOptions,
} from '../data/sampleData'
import { todayIso } from './helpers'

export const STORAGE_KEY = 'school-hub-data-v1'
export const STORAGE_VERSION = 6

const childDefaultsById = sampleData.children.reduce((lookup, child) => {
  lookup[child.id] = child
  return lookup
}, {})

const legacyChildValuesById = {
  ava: {
    name: ['Ava Johnson', 'Emmett Austin'],
    grade: ['3rd Grade', '1st Grade'],
    teacher: ['Ms. Carter', 'Ms. Ramirez'],
    notes: [
      'Ava does best when reading is first, then short math bursts. Keep library books in backpack on Thursdays.',
      'Emmett does best with short directions, a snack first, and reading practice before other homework.',
      'Emmett does best with short directions, a snack first, and reading practice before other homework. Mrs. Lowe sends home quick phonics review cards on Tuesdays.',
    ],
    readingGoalMinutes: [120, 90, 85],
  },
  liam: {
    name: ['Liam Johnson', 'Charlotte Austin'],
    grade: ['5th Grade', '4th Grade'],
    teacher: ['Mr. Brooks', 'Mrs. Bennett'],
    notes: [
      'Liam likes checking off tasks himself. Science projects go smoother when supplies are gathered the night before.',
      'Charlotte likes checking off tasks herself. Writing goes more smoothly when she outlines first and math is split into two short rounds.',
      'Charlotte likes checking off tasks herself. Mrs. Robinson\'s writing assignments go more smoothly when she outlines first and math is split into two short rounds.',
    ],
    readingGoalMinutes: [150, 140, 145],
  },
}

function matchesLegacyValue(expected, actual) {
  if (Array.isArray(expected)) return expected.includes(actual)
  return actual === expected
}

export function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

export function getDefaultChildId(children) {
  return children[0]?.id ?? ''
}

export function createEmptyAssignment(childId) {
  return {
    childId,
    subject: subjectOptions[0],
    title: '',
    dueDate: todayIso(),
    priority: priorityOptions[1],
    status: statusOptions[0],
    notes: '',
  }
}

export function createEmptyPlannerTask(childId) {
  return {
    childId,
    day: weekdayOptions[0],
    subject: subjectOptions[0],
    time: '',
    title: '',
    notes: '',
  }
}

export function createEmptyReadingLog(childId) {
  return {
    childId,
    bookTitle: '',
    date: todayIso(),
    minutesRead: 20,
    pagesRead: 10,
    notes: '',
  }
}

export function createEmptyImportantDate(childId) {
  return {
    childId,
    type: importantDateTypes[0],
    title: '',
    date: todayIso(),
    notes: '',
  }
}

export function createEmptyFileRecord(childId) {
  return {
    childId,
    teacher: '',
    weekOf: todayIso(),
    fileName: '',
  }
}

export function normalizeSchoolHubData(data) {
  const source = data ?? {}
  const baseChildren = sampleData.children
  const rawChildren = Array.isArray(source.children) && source.children.length > 0 ? source.children : baseChildren
  const validChildIds = rawChildren.map((child, index) => child?.id ?? baseChildren[index % baseChildren.length].id)

  const children = rawChildren.map((rawChild, index) => {
    const child = rawChild ?? {}
    const childId = child.id ?? baseChildren[index % baseChildren.length].id
    const defaultChild = childDefaultsById[childId] ?? baseChildren[index % baseChildren.length]
    const legacyChild = legacyChildValuesById[childId]
    const hasLegacyName = legacyChild && matchesLegacyValue(legacyChild.name, child.name)
    const hasLegacyGrade = legacyChild && matchesLegacyValue(legacyChild.grade, child.grade)
    const hasLegacyTeacher = legacyChild && matchesLegacyValue(legacyChild.teacher, child.teacher)
    const hasLegacyNotes = legacyChild && matchesLegacyValue(legacyChild.notes, child.notes)
    const hasLegacyGoal =
      legacyChild && matchesLegacyValue(legacyChild.readingGoalMinutes, Number(child.readingGoalMinutes))

    return {
      ...defaultChild,
      ...child,
      id: childId,
      name: child.name && !hasLegacyName ? child.name : defaultChild.name,
      grade: child.grade && !hasLegacyGrade ? child.grade : defaultChild.grade,
      teacher: child.teacher && !hasLegacyTeacher ? child.teacher : defaultChild.teacher,
      theme: child.theme ?? (index % 2 === 0 ? 'coral' : 'sky'),
      notes: child.notes && !hasLegacyNotes ? child.notes : defaultChild.notes,
      readingGoalMinutes: Number(
        child.readingGoalMinutes != null && !hasLegacyGoal
          ? child.readingGoalMinutes
          : defaultChild.readingGoalMinutes,
      ),
    }
  })

  const fallbackChildId = children[0]?.id ?? getDefaultChildId(baseChildren)

  return {
    ...sampleData,
    ...source,
    storageVersion: STORAGE_VERSION,
    children,
    assignments: Array.isArray(source.assignments)
      ? source.assignments.map((rawAssignment) => {
          const assignment = rawAssignment ?? {}

          return {
            id: assignment.id ?? createId('assignment'),
            childId: validChildIds.includes(assignment.childId) ? assignment.childId : fallbackChildId,
            subject: assignment.subject ?? subjectOptions[0],
            title: assignment.title ?? 'Untitled assignment',
            dueDate: assignment.dueDate ?? todayIso(),
            priority: assignment.priority ?? priorityOptions[1],
            status: assignment.status ?? statusOptions[0],
            notes: assignment.notes ?? '',
          }
        })
      : sampleData.assignments,
    plannerTasks: Array.isArray(source.plannerTasks)
      ? source.plannerTasks.map((rawTask) => {
          const task = rawTask ?? {}

          return {
            id: task.id ?? createId('planner'),
            childId: validChildIds.includes(task.childId) ? task.childId : fallbackChildId,
            day: task.day ?? weekdayOptions[0],
            title: task.title ?? task.task ?? 'Study task',
            subject: task.subject ?? subjectOptions[0],
            time: task.time ?? '',
            notes: task.notes ?? '',
            isGenerated: Boolean(task.isGenerated ?? (task.generatedBy === 'weekly-plan')),
            generatedBy: task.generatedBy ?? null,
            category: task.category ?? null,
            sourceId: task.sourceId ?? null,
            sourceType: task.sourceType ?? null,
          }
        })
      : Array.isArray(source.planner)
        ? source.planner.map((task) => ({
            id: task.id ?? createId('planner'),
            childId: task.childId ?? fallbackChildId,
            day: task.day ?? weekdayOptions[0],
            title: task.title ?? task.task ?? 'Study task',
            subject: task.subject ?? subjectOptions[0],
            time: task.time ?? '',
            notes: task.notes ?? '',
            isGenerated: Boolean(task.isGenerated ?? (task.generatedBy === 'weekly-plan')),
            generatedBy: task.generatedBy ?? null,
            category: task.category ?? null,
            sourceId: task.sourceId ?? null,
            sourceType: task.sourceType ?? null,
          }))
        : sampleData.plannerTasks,
    readingLogs: Array.isArray(source.readingLogs)
      ? source.readingLogs.map((rawEntry) => {
          const entry = rawEntry ?? {}

          return {
            id: entry.id ?? createId('reading'),
            childId: validChildIds.includes(entry.childId) ? entry.childId : fallbackChildId,
            bookTitle: entry.bookTitle ?? '',
            date: entry.date ?? todayIso(),
            minutesRead: Number(entry.minutesRead ?? entry.minutes ?? 0),
            pagesRead: Number(entry.pagesRead ?? 0),
            notes: entry.notes ?? '',
          }
        })
      : Array.isArray(source.readingLog)
        ? source.readingLog.map((entry) => ({
            id: entry.id ?? createId('reading'),
            childId: entry.childId ?? fallbackChildId,
            bookTitle: entry.bookTitle ?? '',
            date: entry.date ?? todayIso(),
            minutesRead: Number(entry.minutesRead ?? entry.minutes ?? 0),
            pagesRead: Number(entry.pagesRead ?? 0),
            notes: entry.notes ?? '',
          }))
        : sampleData.readingLogs,
    importantDates: Array.isArray(source.importantDates)
      ? source.importantDates.map((rawItem) => {
          const item = rawItem ?? {}

          return {
            id: item.id ?? createId('date'),
            childId: validChildIds.includes(item.childId) ? item.childId : fallbackChildId,
            title: item.title ?? 'School event',
            type: item.type ?? importantDateTypes[0],
            date: item.date ?? todayIso(),
            notes: item.notes ?? '',
          }
        })
      : sampleData.importantDates,
    files: Array.isArray(source.files)
      ? source.files.map((rawFile) => {
          const file = rawFile ?? {}

          return {
            id: file.id ?? createId('file'),
            childId: validChildIds.includes(file.childId) ? file.childId : fallbackChildId,
            fileName: file.fileName ?? 'Uploaded file',
            teacher: file.teacher ?? '',
            weekOf: file.weekOf ?? (file.uploadedAt ? file.uploadedAt.slice(0, 10) : todayIso()),
            uploadedAt: file.uploadedAt ?? new Date().toISOString(),
            sizeLabel: file.sizeLabel ?? 'Saved locally',
          }
        })
      : Array.isArray(source.uploads)
        ? source.uploads.map((file) => ({
            id: file.id ?? createId('file'),
            childId: file.childId ?? fallbackChildId,
            fileName: file.fileName ?? 'Uploaded file',
            teacher: file.teacher ?? '',
            weekOf: file.weekOf ?? (file.uploadedAt ? file.uploadedAt.slice(0, 10) : todayIso()),
            uploadedAt: file.uploadedAt ?? new Date().toISOString(),
            sizeLabel: file.sizeLabel ?? 'Saved locally',
          }))
        : sampleData.files,
    weeklyNotes: typeof source.weeklyNotes === 'string' ? source.weeklyNotes : sampleData.weeklyNotes,
  }
}
