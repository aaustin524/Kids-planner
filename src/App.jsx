import { useEffect, useMemo, useState } from 'react'
import AssignmentsView from './components/AssignmentsView'
import DashboardView from './components/DashboardView'
import FilesView from './components/FilesView'
import ImportantDatesView from './components/ImportantDatesView'
import ReadingLogView from './components/ReadingLogView'
import TopNav from './components/TopNav'
import WeeklyImportView from './components/WeeklyImportView'
import WeeklyPlannerView from './components/WeeklyPlannerView'
import { SaveNotice } from './components/ui'
import { sampleData, weekdayOptions } from './data/sampleData'
import {
  validateAssignment,
  validateFileRecord,
  validateImportantDate,
  validatePlannerTask,
  validateReadingLog,
} from './lib/forms'
import {
  analyzeWeeklyImport,
  buildWeeklyImportPreview,
  createEmptyImportSuggestion,
  getValidWeeklyImportEntries,
  mergeImportedWeek,
  splitWeeklyImportSuggestions,
} from './lib/importWeeklySchedule'
import { extractPdfText } from './lib/extractPdfText'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useSchoolHubForms } from './hooks/useSchoolHubForms'
import { compareTimeLabels, getWeekRange, getWeekdayLabel, isDueSoon, isOverdue, sumReadingMinutes, todayIso } from './lib/helpers'
import {
  STORAGE_KEY,
  createId,
  getDefaultChildId,
  normalizeSchoolHubData,
} from './lib/storage'

function App() {
  const [storedSchoolHub, setStoredSchoolHub] = useLocalStorage(STORAGE_KEY, sampleData)
  const schoolHub = useMemo(() => normalizeSchoolHubData(storedSchoolHub), [storedSchoolHub])
  const defaultChildId = useMemo(() => getDefaultChildId(schoolHub.children), [schoolHub.children])
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [assignmentFilters, setAssignmentFilters] = useState({
    childId: 'all',
    subject: 'all',
    status: 'all',
    search: '',
  })
  const [saveMessage, setSaveMessage] = useState(null)
  const [weeklyImportStep, setWeeklyImportStep] = useState('upload')
  const [weeklyImportUpload, setWeeklyImportUpload] = useState({
    childId: defaultChildId,
    weekOf: todayIso(),
    notes: '',
    teacher: '',
    extractedText: '',
  })
  const [selectedWeeklyImportFile, setSelectedWeeklyImportFile] = useState(null)
  const [weeklyImportSummary, setWeeklyImportSummary] = useState({
    detectedDates: 0,
    detectedAssessments: 0,
    suggestionChips: [],
    statusMessage: '',
    extractionStatus: 'idle',
    suggestedAssignments: 0,
    suggestedImportantDates: 0,
    unmatchedLines: 0,
    suggestionCount: 0,
  })
  const [lastWeeklyImportChildId, setLastWeeklyImportChildId] = useState(defaultChildId)
  const [weeklyImportSuggestions, setWeeklyImportSuggestions] = useState(() => [])
  const [weeklyImportPreview, setWeeklyImportPreview] = useState({
    assignments: [],
    importantDates: [],
    plannerTasks: [],
  })
  const {
    assignmentForm,
    setAssignmentForm,
    plannerForm,
    setPlannerForm,
    readingForm,
    setReadingForm,
    importantDateForm,
    setImportantDateForm,
    fileForm,
    setFileForm,
    selectedUploadFile,
    setSelectedUploadFile,
    fileInputKey,
    editingAssignmentId,
    setEditingAssignmentId,
    editingPlannerId,
    setEditingPlannerId,
    editingReadingId,
    setEditingReadingId,
    editingImportantDateId,
    setEditingImportantDateId,
    editingFileId,
    setEditingFileId,
    resetAssignmentForm,
    resetPlannerForm,
    resetReadingForm,
    resetImportantDateForm,
    resetFileForm,
  } = useSchoolHubForms(defaultChildId)

  useEffect(() => {
    const normalized = normalizeSchoolHubData(storedSchoolHub)
    if (JSON.stringify(normalized) !== JSON.stringify(storedSchoolHub)) {
      setStoredSchoolHub(normalized)
    }
  }, [setStoredSchoolHub, storedSchoolHub])

  useEffect(() => {
    setWeeklyImportUpload((current) => (current.childId ? current : { ...current, childId: defaultChildId }))
  }, [defaultChildId])

  useEffect(() => {
    if (!weeklyImportUpload.childId || weeklyImportUpload.childId === lastWeeklyImportChildId) return

    if (weeklyImportStep !== 'upload') {
      setWeeklyImportSuggestions((current) =>
        current.map((item) => ({
          ...item,
          childId: item.childId === lastWeeklyImportChildId || !item.childId ? weeklyImportUpload.childId : item.childId,
        })),
      )
    }

    setLastWeeklyImportChildId(weeklyImportUpload.childId)
  }, [lastWeeklyImportChildId, weeklyImportStep, weeklyImportUpload.childId])

  // These lookup and "with names" collections keep the view components simple and presentation-focused.
  const childrenById = useMemo(
    () =>
      schoolHub.children.reduce((lookup, child) => {
        lookup[child.id] = child
        return lookup
      }, {}),
    [schoolHub.children],
  )

  const assignmentsWithNames = useMemo(
    () =>
      schoolHub.assignments
        .map((assignment) => ({
          ...assignment,
          childName: childrenById[assignment.childId]?.name ?? 'Child',
        }))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [childrenById, schoolHub.assignments],
  )

  const plannerTasksWithNames = useMemo(
    () =>
      schoolHub.plannerTasks
        .map((task) => ({
          ...task,
          childName: childrenById[task.childId]?.name ?? 'Child',
        }))
        .sort((a, b) => {
          if (a.day === b.day) return compareTimeLabels(a.time, b.time)
          return weekdayOptions.indexOf(a.day) - weekdayOptions.indexOf(b.day)
        }),
    [childrenById, schoolHub.plannerTasks],
  )
  const generatedPlannerCount = useMemo(
    () => schoolHub.plannerTasks.filter((task) => task.generatedBy === 'weekly-plan').length,
    [schoolHub.plannerTasks],
  )

  const currentWeekKey = getWeekRange(todayIso())

  const readingLogsWithNames = useMemo(
    () =>
      [...schoolHub.readingLogs]
        .map((entry) => ({
          ...entry,
          childName: childrenById[entry.childId]?.name ?? 'Child',
        }))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [childrenById, schoolHub.readingLogs],
  )

  const importantDatesWithNames = useMemo(
    () =>
      [...schoolHub.importantDates]
        .map((item) => ({
          ...item,
          childName: childrenById[item.childId]?.name ?? 'Child',
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [childrenById, schoolHub.importantDates],
  )

  const filesWithNames = useMemo(
    () =>
      [...schoolHub.files]
        .map((file) => ({
          ...file,
          childName: childrenById[file.childId]?.name ?? 'Child',
        }))
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    [childrenById, schoolHub.files],
  )

  const childStats = useMemo(
    () =>
      schoolHub.children.reduce((stats, child) => {
        const childAssignments = schoolHub.assignments.filter((assignment) => assignment.childId === child.id)
        const childWeeklyReading = schoolHub.readingLogs.filter(
          (entry) => entry.childId === child.id && getWeekRange(entry.date) === currentWeekKey,
        )

        stats[child.id] = {
          dueSoon: childAssignments.filter((assignment) => isDueSoon(assignment.dueDate, assignment.status)).length,
          overdue: childAssignments.filter((assignment) => isOverdue(assignment.dueDate, assignment.status)).length,
          completed: childAssignments.filter((assignment) => assignment.status === 'Done').length,
          readingMinutes: sumReadingMinutes(childWeeklyReading),
        }

        return stats
      }, {}),
    [currentWeekKey, schoolHub.assignments, schoolHub.children, schoolHub.readingLogs],
  )

  const filteredAssignments = useMemo(
    () =>
      assignmentsWithNames.filter((assignment) => {
        if (assignmentFilters.childId !== 'all' && assignment.childId !== assignmentFilters.childId) return false
        if (assignmentFilters.subject !== 'all' && assignment.subject !== assignmentFilters.subject) return false
        if (assignmentFilters.status !== 'all' && assignment.status !== assignmentFilters.status) return false
        if (
          assignmentFilters.search &&
          !`${assignment.title} ${assignment.notes}`.toLowerCase().includes(assignmentFilters.search.toLowerCase())
        ) return false
        return true
      }),
    [assignmentFilters, assignmentsWithNames],
  )

  const currentWeekReadingLogs = readingLogsWithNames.filter((entry) => getWeekRange(entry.date) === currentWeekKey)
  const currentWeekAssignments = assignmentsWithNames.filter((assignment) => getWeekRange(assignment.dueDate) === currentWeekKey)
  const upcomingDates = importantDatesWithNames.filter((item) => item.date >= todayIso()).slice(0, 5)
  const todayLabel = getWeekdayLabel(todayIso())
  const todayItems = [
    ...plannerTasksWithNames
      .filter((task) => task.day === todayLabel)
      .sort((a, b) => compareTimeLabels(a.time, b.time))
      .map((task) => ({
        id: task.id,
        kind: 'Planner task',
        title: task.title,
        childName: task.childName,
        meta: `${task.subject}${task.time ? ` · ${task.time}` : ''}`,
      })),
    ...assignmentsWithNames
      .filter((assignment) => assignment.dueDate === todayIso() && assignment.status !== 'Done')
      .map((assignment) => ({
        id: assignment.id,
        kind: 'Due today',
        title: assignment.title,
        childName: assignment.childName,
        meta: `${assignment.subject} · ${assignment.priority} priority`,
      })),
    ...assignmentsWithNames
      .filter((assignment) => isOverdue(assignment.dueDate, assignment.status) && assignment.priority === 'High')
      .slice(0, 3)
      .map((assignment) => ({
        id: `${assignment.id}-overdue`,
        kind: 'Overdue high priority',
        title: assignment.title,
        childName: assignment.childName,
        meta: `${assignment.subject} · originally due ${assignment.dueDate}`,
      })),
  ]
  const assignmentStatusSummary = {
    visible: filteredAssignments.length,
    dueSoon: filteredAssignments.filter((item) => isDueSoon(item.dueDate, item.status)).length,
    overdue: filteredAssignments.filter((item) => isOverdue(item.dueDate, item.status)).length,
    completed: filteredAssignments.filter((item) => item.status === 'Done').length,
  }

  // Centralized updates make it easier to swap localStorage for an API later without rewriting every view.
  const updateSchoolHub = (updater) => {
    setStoredSchoolHub((current) => {
      const normalizedCurrent = normalizeSchoolHubData(current)
      const nextValue = typeof updater === 'function' ? updater(normalizedCurrent) : updater
      return normalizeSchoolHubData(nextValue)
    })
  }

  const flashSaved = (text, type = 'success') => {
    setSaveMessage({ text, type })
    window.clearTimeout(flashSaved.timeoutId)
    flashSaved.timeoutId = window.setTimeout(() => setSaveMessage(null), 2200)
  }

  const updateChildNotes = (childId, notes) => {
    updateSchoolHub((current) => ({
      ...current,
      children: current.children.map((child) => (child.id === childId ? { ...child, notes } : child)),
    }))
    flashSaved('Child notes saved.')
  }

  const handleAssignmentSubmit = (event) => {
    event.preventDefault()
    const error = validateAssignment(assignmentForm)
    if (error) return flashSaved(error, 'error')

    updateSchoolHub((current) => {
      const nextAssignment = { ...assignmentForm, title: assignmentForm.title.trim(), notes: assignmentForm.notes.trim() }

      return {
        ...current,
        assignments: editingAssignmentId
          ? current.assignments.map((item) => (item.id === editingAssignmentId ? { ...item, ...nextAssignment } : item))
          : [{ id: createId('assignment'), ...nextAssignment }, ...current.assignments],
      }
    })

    resetAssignmentForm()
    flashSaved(editingAssignmentId ? 'Assignment updated.' : 'Assignment saved.')
  }

  const handleAssignmentEdit = (assignmentId) => {
    const assignment = schoolHub.assignments.find((item) => item.id === assignmentId)
    if (!assignment) return

    setAssignmentForm({
      childId: assignment.childId,
      subject: assignment.subject,
      title: assignment.title,
      dueDate: assignment.dueDate,
      priority: assignment.priority,
      status: assignment.status,
      notes: assignment.notes,
    })
    setEditingAssignmentId(assignmentId)
    setActiveTab('Assignments')
  }

  const handlePlannerEdit = (taskId) => {
    const task = schoolHub.plannerTasks.find((item) => item.id === taskId)
    if (!task) return
    setPlannerForm({ ...task })
    setEditingPlannerId(taskId)
    setActiveTab('Weekly Planner')
  }

  const handleReadingEdit = (entryId) => {
    const entry = schoolHub.readingLogs.find((item) => item.id === entryId)
    if (!entry) return
    setReadingForm({ ...entry })
    setEditingReadingId(entryId)
    setActiveTab('Reading Log')
  }

  const handleImportantDateEdit = (dateId) => {
    const item = schoolHub.importantDates.find((entry) => entry.id === dateId)
    if (!item) return
    setImportantDateForm({ ...item })
    setEditingImportantDateId(dateId)
    setActiveTab('Important Dates')
  }

  const handleFileEdit = (fileId) => {
    const file = schoolHub.files.find((item) => item.id === fileId)
    if (!file) return
    setFileForm({
      childId: file.childId,
      teacher: file.teacher,
      weekOf: file.weekOf,
      fileName: file.fileName,
    })
    setSelectedUploadFile(null)
    setEditingFileId(fileId)
    setFileInputKey((current) => current + 1)
    setActiveTab('Files')
  }

  const handleQuickAdd = (childId) => {
    setAssignmentForm((current) => ({ ...current, childId, title: '', dueDate: todayIso(), notes: '' }))
    setEditingAssignmentId(null)
    setActiveTab('Assignments')
  }

  const handleDeleteByKey = (key, id, message) => {
    updateSchoolHub((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.id !== id),
    }))
    if (message) flashSaved(message)
  }

  const handlePlannerSubmit = (event) => {
    event.preventDefault()
    const error = validatePlannerTask(plannerForm)
    if (error) return flashSaved(error, 'error')

    updateSchoolHub((current) => ({
      ...current,
      plannerTasks: editingPlannerId
        ? current.plannerTasks.map((item) =>
            item.id === editingPlannerId
              ? { ...item, ...plannerForm, title: plannerForm.title.trim(), notes: plannerForm.notes.trim(), time: plannerForm.time.trim() }
              : item,
          )
        : [{ id: createId('planner'), ...plannerForm, title: plannerForm.title.trim(), notes: plannerForm.notes.trim(), time: plannerForm.time.trim() }, ...current.plannerTasks],
    }))
    resetPlannerForm()
    flashSaved(editingPlannerId ? 'Planner task updated.' : 'Planner task saved.')
  }

  const handleGeneratePlan = () => {
    let generatedCount = 0

    updateSchoolHub((current) => {
      const manualPlannerTasks = current.plannerTasks.filter((task) => task.generatedBy !== 'weekly-plan')
      const generatedTasks = generateWeeklyPlan({
        assignments: current.assignments,
        importantDates: current.importantDates,
        children: current.children,
        plannerTasks: current.plannerTasks,
      })

      generatedCount = generatedTasks.length

      return {
        ...current,
        plannerTasks: [...generatedTasks, ...manualPlannerTasks],
      }
    })

    if (generatedCount === 0) {
      flashSaved('No plan items were generated from the current assignments and dates.', 'error')
      return
    }

    flashSaved('Weekly plan generated.')
  }

  const resetWeeklyImport = () => {
    setWeeklyImportStep('upload')
    setWeeklyImportUpload({
      childId: defaultChildId,
      weekOf: todayIso(),
      notes: '',
      teacher: '',
      extractedText: '',
    })
    setSelectedWeeklyImportFile(null)
    setWeeklyImportSummary({
      detectedDates: 0,
      detectedAssessments: 0,
      suggestionChips: [],
      statusMessage: '',
      extractionStatus: 'idle',
      suggestedAssignments: 0,
      suggestedImportantDates: 0,
      unmatchedLines: 0,
      suggestionCount: 0,
    })
    setWeeklyImportSuggestions([])
    setWeeklyImportPreview({
      assignments: [],
      importantDates: [],
      plannerTasks: [],
    })
  }

  const handleAnalyzeWeeklyImport = async () => {
    if (!selectedWeeklyImportFile) {
      flashSaved('Please upload a weekly file before starting the guided import.', 'error')
      return
    }

    const extractedResult = await extractPdfText(selectedWeeklyImportFile)
    const extractedText = extractedResult.text || weeklyImportUpload.extractedText
    const suggestions = analyzeWeeklyImport({
      text: extractedText,
      fileName: selectedWeeklyImportFile.name,
      children: schoolHub.children,
      selectedChildId: weeklyImportUpload.childId,
      defaultChildId: weeklyImportUpload.childId || defaultChildId,
      weekOf: weeklyImportUpload.weekOf,
    })

    setWeeklyImportUpload((current) => ({
      ...current,
      extractedText,
    }))
    setWeeklyImportSuggestions(
      [
        ...suggestions.suggestions,
        ...suggestions.unmatchedLines,
      ].map((item) => ({
        ...item,
        childId: weeklyImportUpload.childId || defaultChildId,
      })),
    )
    setWeeklyImportSummary({
      ...suggestions.summary,
      statusMessage: extractedResult.message,
      extractionStatus: extractedResult.status,
    })
    setWeeklyImportStep('extract')
  }

  const handleReviewWeeklyImport = () => {
    const validEntries = getValidWeeklyImportEntries(weeklyImportSuggestions)
    if (validEntries.assignments.length === 0 && validEntries.importantDates.length === 0) {
      flashSaved('Add at least one assignment or important date before reviewing the import.', 'error')
      return
    }

    setWeeklyImportPreview(
      buildWeeklyImportPreview({
        selectedChildId: weeklyImportUpload.childId,
        currentAssignments: schoolHub.assignments,
        currentImportantDates: schoolHub.importantDates,
        currentPlannerTasks: schoolHub.plannerTasks,
        importAssignments: validEntries.assignments,
        importImportantDates: validEntries.importantDates,
        children: schoolHub.children,
      }) ?? { assignments: [], importantDates: [], plannerTasks: [] },
    )
    setWeeklyImportStep('review')
  }

  const handleImportWeek = (selectedChildId, draftedAssignments, draftedImportantDates) => {
    if (draftedAssignments.length === 0 && draftedImportantDates.length === 0) {
      flashSaved('There is nothing ready to import yet.', 'error')
      return
    }

    updateSchoolHub((current) => {
      const mergedImport = mergeImportedWeek({
        selectedChildId,
        draftedAssignments,
        draftedImportantDates,
        currentAssignments: current.assignments,
        currentImportantDates: current.importantDates,
        currentPlannerTasks: current.plannerTasks,
        children: current.children,
        createId,
      })
      const touchedChildIds = Array.from(
        new Set([
          selectedChildId,
          ...mergedImport.assignmentsToAdd.map((item) => item.childId),
          ...mergedImport.importantDatesToAdd.map((item) => item.childId),
        ]),
      ).filter(Boolean)
      const fileName = selectedWeeklyImportFile?.name ?? 'weekly-import.pdf'
      const sizeLabel = selectedWeeklyImportFile
        ? `${Math.max(1, Math.round(selectedWeeklyImportFile.size / 1024))} KB`
        : 'Saved locally'
      const importedFiles = touchedChildIds.map((childId) => ({
        id: createId('file'),
        childId,
        teacher: weeklyImportUpload.teacher.trim() || childrenById[childId]?.teacher || '',
        weekOf: weeklyImportUpload.weekOf,
        fileName,
        uploadedAt: new Date().toISOString(),
        sizeLabel,
        notes: weeklyImportUpload.notes.trim(),
      }))

      return {
        ...current,
        assignments: mergedImport.nextAssignments,
        importantDates: mergedImport.nextImportantDates,
        plannerTasks: mergedImport.plannerTasks,
        files: [...importedFiles, ...current.files],
      }
    })

    resetWeeklyImport()
    flashSaved('Weekly schedule imported and plan updated.')
  }

  const handleReadingSubmit = (event) => {
    event.preventDefault()
    const error = validateReadingLog(readingForm)
    if (error) return flashSaved(error, 'error')

    updateSchoolHub((current) => ({
      ...current,
      readingLogs: editingReadingId
        ? current.readingLogs.map((item) =>
            item.id === editingReadingId
              ? {
                  ...item,
                  ...readingForm,
                  bookTitle: readingForm.bookTitle.trim(),
                  minutesRead: Math.max(0, Number(readingForm.minutesRead)),
                  pagesRead: Math.max(0, Number(readingForm.pagesRead)),
                  notes: readingForm.notes.trim(),
                }
              : item,
          )
        : [
            {
              id: createId('reading'),
              ...readingForm,
              bookTitle: readingForm.bookTitle.trim(),
              minutesRead: Math.max(0, Number(readingForm.minutesRead)),
              pagesRead: Math.max(0, Number(readingForm.pagesRead)),
              notes: readingForm.notes.trim(),
            },
            ...current.readingLogs,
          ],
    }))
    resetReadingForm()
    flashSaved(editingReadingId ? 'Reading log updated.' : 'Reading log saved.')
  }

  const handleImportantDateSubmit = (event) => {
    event.preventDefault()
    const error = validateImportantDate(importantDateForm)
    if (error) return flashSaved(error, 'error')

    updateSchoolHub((current) => ({
      ...current,
      importantDates: editingImportantDateId
        ? current.importantDates.map((item) =>
            item.id === editingImportantDateId
              ? { ...item, ...importantDateForm, title: importantDateForm.title.trim(), notes: importantDateForm.notes.trim() }
              : item,
          )
        : [{ id: createId('date'), ...importantDateForm, title: importantDateForm.title.trim(), notes: importantDateForm.notes.trim() }, ...current.importantDates],
    }))
    resetImportantDateForm()
    flashSaved(editingImportantDateId ? 'Important date updated.' : 'Important date saved.')
  }

  const handleFileSubmit = (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const uploadInput = formElement.elements.namedItem('upload')
    const inputFile = uploadInput && 'files' in uploadInput ? uploadInput.files?.[0] ?? null : null
    const file = selectedUploadFile ?? inputFile
    const error = validateFileRecord(fileForm)
    if (error) return flashSaved(error, 'error')
    if (!editingFileId && !file) return flashSaved('Please choose a file for the new record.', 'error')

    const child = childrenById[fileForm.childId]
    const existing = schoolHub.files.find((item) => item.id === editingFileId)

    updateSchoolHub((current) => ({
      ...current,
      files: editingFileId
        ? current.files.map((item) =>
            item.id === editingFileId
              ? {
                  ...item,
                  childId: fileForm.childId,
                  teacher: fileForm.teacher.trim() || child?.teacher || '',
                  weekOf: fileForm.weekOf,
                  fileName: fileForm.fileName.trim(),
                  sizeLabel: file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : existing?.sizeLabel ?? item.sizeLabel,
                }
              : item,
          )
        : [
            {
              id: createId('file'),
              childId: fileForm.childId,
              teacher: fileForm.teacher.trim() || child?.teacher || '',
              weekOf: fileForm.weekOf,
              fileName: fileForm.fileName.trim(),
              uploadedAt: new Date().toISOString(),
              sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            },
            ...current.files,
          ],
    }))

    formElement.reset()
    resetFileForm()
    flashSaved(editingFileId ? 'File record updated.' : 'File record saved.')
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'Assignments':
        return (
          <AssignmentsView
            children={schoolHub.children}
            assignments={filteredAssignments}
            filters={assignmentFilters}
            form={assignmentForm}
            editingId={editingAssignmentId}
            statusSummary={assignmentStatusSummary}
            onFilterChange={(field, value) => setAssignmentFilters((current) => ({ ...current, [field]: value }))}
            onFormChange={(field, value) => setAssignmentForm((current) => ({ ...current, [field]: value }))}
            onSubmit={handleAssignmentSubmit}
            onEdit={handleAssignmentEdit}
            onDelete={(id) => handleDeleteByKey('assignments', id, 'Assignment deleted.')}
            onStatusChange={(id, status) => {
              updateSchoolHub((current) => ({
                ...current,
                assignments: current.assignments.map((item) => (item.id === id ? { ...item, status } : item)),
              }))
              flashSaved('Assignment status updated.')
            }}
            onCancelEdit={() => {
              resetAssignmentForm()
            }}
          />
        )
      case 'Weekly Planner':
        return (
          <WeeklyPlannerView
            children={schoolHub.children}
            plannerTasks={plannerTasksWithNames}
            assignments={currentWeekAssignments}
            form={plannerForm}
            editingId={editingPlannerId}
            generatedPlannerCount={generatedPlannerCount}
            onGeneratePlan={handleGeneratePlan}
            onFormChange={(field, value) => setPlannerForm((current) => ({ ...current, [field]: value }))}
            onSubmit={handlePlannerSubmit}
            onDeleteTask={(id) => handleDeleteByKey('plannerTasks', id, 'Planner task deleted.')}
            onEditTask={handlePlannerEdit}
            onCancelEdit={resetPlannerForm}
            onQuickAddDay={(day) => {
              setPlannerForm((current) => ({ ...current, day }))
              setEditingPlannerId(null)
            }}
          />
        )
      case 'Reading Log':
        return (
          <ReadingLogView
            children={schoolHub.children}
            readingLogs={currentWeekReadingLogs}
            form={readingForm}
            editingId={editingReadingId}
            onFormChange={(field, value) => setReadingForm((current) => ({ ...current, [field]: value }))}
            onSubmit={handleReadingSubmit}
            onDelete={(id) => handleDeleteByKey('readingLogs', id, 'Reading log deleted.')}
            onEdit={handleReadingEdit}
            onCancelEdit={resetReadingForm}
          />
        )
      case 'Files':
        return (
          <FilesView
            children={schoolHub.children}
            files={filesWithNames}
            form={fileForm}
            editingId={editingFileId}
            selectedFileName={selectedUploadFile?.name ?? ''}
            onFormChange={(field, value) => setFileForm((current) => ({ ...current, [field]: value }))}
            onFileChange={(file) => {
              setSelectedUploadFile(file)
              if (file) setFileForm((current) => ({ ...current, fileName: file.name }))
            }}
            onSubmit={handleFileSubmit}
            onDelete={(id) => handleDeleteByKey('files', id, 'File record deleted.')}
            onEdit={handleFileEdit}
            onCancelEdit={resetFileForm}
            key={fileInputKey}
          />
        )
      case 'Weekly Import':
        {
          const validImportEntries = getValidWeeklyImportEntries(weeklyImportSuggestions)
          const suggestionBuckets = splitWeeklyImportSuggestions(weeklyImportSuggestions)

        return (
          <WeeklyImportView
            children={schoolHub.children}
            upload={weeklyImportUpload}
            selectedFileName={selectedWeeklyImportFile?.name ?? ''}
            summary={weeklyImportSummary}
            suggestions={weeklyImportSuggestions}
            suggestionBuckets={suggestionBuckets}
            preview={weeklyImportPreview}
            step={weeklyImportStep}
            uploadDate={selectedWeeklyImportFile ? new Date().toISOString() : ''}
            onUploadChange={(field, value) => setWeeklyImportUpload((current) => ({ ...current, [field]: value }))}
            onFileChange={setSelectedWeeklyImportFile}
            onAnalyze={handleAnalyzeWeeklyImport}
            onSuggestionChange={(draftId, field, value) =>
              setWeeklyImportSuggestions((current) =>
                current.map((item) => (item.id === draftId ? { ...item, [field]: value } : item)),
              )
            }
            onAddSuggestion={(category) =>
              setWeeklyImportSuggestions((current) => [
                ...current,
                createEmptyImportSuggestion(weeklyImportUpload.childId || defaultChildId, category),
              ])
            }
            onPromoteUnmatched={(draftId, category) =>
              setWeeklyImportSuggestions((current) =>
                current.map((item) =>
                  item.id === draftId
                    ? {
                        ...item,
                        category,
                        type: category === 'Important Date' ? item.type || 'Reminder' : '',
                        subject: category === 'Assignment' ? item.subject || 'General' : item.subject,
                      }
                    : item,
                ),
              )
            }
            onRemoveSuggestion={(draftId) => setWeeklyImportSuggestions((current) => current.filter((item) => item.id !== draftId))}
            onGoToReview={handleReviewWeeklyImport}
            onBackToExtract={() => setWeeklyImportStep('extract')}
            onImport={() =>
              handleImportWeek(
                weeklyImportUpload.childId,
                validImportEntries.assignments,
                validImportEntries.importantDates,
              )
            }
            onImportAndPlan={() =>
              handleImportWeek(
                weeklyImportUpload.childId,
                validImportEntries.assignments,
                validImportEntries.importantDates,
              )
            }
          />
        )
        }
      case 'Important Dates':
        return (
          <ImportantDatesView
            children={schoolHub.children}
            importantDates={importantDatesWithNames}
            form={importantDateForm}
            editingId={editingImportantDateId}
            onFormChange={(field, value) => setImportantDateForm((current) => ({ ...current, [field]: value }))}
            onSubmit={handleImportantDateSubmit}
            onDelete={(id) => handleDeleteByKey('importantDates', id, 'Important date deleted.')}
            onEdit={handleImportantDateEdit}
            onCancelEdit={resetImportantDateForm}
          />
        )
      case 'Dashboard':
      default:
        return (
          <DashboardView
            children={schoolHub.children}
            childStats={childStats}
            todayItems={todayItems}
            importantDates={upcomingDates}
            weeklyNotes={schoolHub.weeklyNotes}
            onWeeklyNotesChange={(notes) => {
              updateSchoolHub((current) => ({ ...current, weeklyNotes: notes }))
              flashSaved('Weekly notes saved.')
            }}
            onQuickAdd={handleQuickAdd}
            onChildNotesChange={updateChildNotes}
          />
        )
    }
  }

  return (
    <div className="min-h-screen text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SaveNotice message={saveMessage} />
        <header className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-soft backdrop-blur">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(135,182,217,0.22),_transparent_70%)] lg:block" />
          <div className="relative flex flex-col items-start gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 max-w-3xl flex-1">
              <p className="font-display text-sm uppercase tracking-[0.28em] text-plum">School Hub</p>
              <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
                A polished family workspace for assignments, routines, reading, and school dates.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                Built to feel calm and clear for parents while staying easy to expand as your family&apos;s school life changes.
              </p>
            </div>

            <div className="grid w-full flex-none items-start gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:w-[28rem] xl:grid-cols-2">
              <HeroStat label="Open assignments" value={schoolHub.assignments.filter((item) => item.status !== 'Done').length} tone="bg-coral/15 text-coral" />
              <HeroStat label="Completed" value={schoolHub.assignments.filter((item) => item.status === 'Done').length} tone="bg-emerald-100 text-emerald-700" />
              <HeroStat label="This week reading" value={`${sumReadingMinutes(currentWeekReadingLogs)} min`} tone="bg-mint/20 text-teal-700" />
              <HeroStat label="Upcoming dates" value={upcomingDates.length} tone="bg-sky/15 text-sky" />
            </div>
          </div>
        </header>

        <div className="mt-6">
          <TopNav activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <main className="mt-6">{renderTab()}</main>
      </div>
    </div>
  )
}

function HeroStat({ label, value, tone }) {
  return (
    <div className={`min-w-0 rounded-3xl border border-white/70 px-5 py-4 ${tone}`}>
      <p className="min-w-0 text-sm font-medium leading-5">{label}</p>
      <p className="mt-2 whitespace-nowrap font-display text-3xl leading-none">{value}</p>
    </div>
  )
}

export default App
