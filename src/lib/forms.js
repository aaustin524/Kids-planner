export function validateAssignment(form) {
  if (!form.childId || !form.title.trim() || !form.dueDate) {
    return 'Please complete the assignment title, child, and due date.'
  }

  return null
}

export function validatePlannerTask(form) {
  if (!form.childId || !form.day || !form.subject || !form.title.trim()) {
    return 'Please complete the planner task details.'
  }

  return null
}

export function validateReadingLog(form) {
  if (!form.childId || !form.bookTitle.trim() || !form.date) {
    return 'Please complete the reading log details.'
  }

  if (Number(form.minutesRead) < 0 || Number(form.pagesRead) < 0) {
    return 'Reading minutes and pages must be zero or more.'
  }

  return null
}

export function validateImportantDate(form) {
  if (!form.childId || !form.title.trim() || !form.date || !form.type) {
    return 'Please complete the important date details.'
  }

  return null
}

export function validateFileRecord(form) {
  if (!form.childId || !form.fileName?.trim() || !form.weekOf) {
    return 'Please add a file name, child, and week.'
  }

  return null
}
