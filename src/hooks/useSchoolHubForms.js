import { useEffect, useState } from 'react'
import {
  createEmptyAssignment,
  createEmptyFileRecord,
  createEmptyImportantDate,
  createEmptyPlannerTask,
  createEmptyReadingLog,
} from '../lib/storage'

export function useSchoolHubForms(defaultChildId) {
  const [assignmentForm, setAssignmentForm] = useState(() => createEmptyAssignment(defaultChildId))
  const [plannerForm, setPlannerForm] = useState(() => createEmptyPlannerTask(defaultChildId))
  const [readingForm, setReadingForm] = useState(() => createEmptyReadingLog(defaultChildId))
  const [importantDateForm, setImportantDateForm] = useState(() => createEmptyImportantDate(defaultChildId))
  const [fileForm, setFileForm] = useState(() => createEmptyFileRecord(defaultChildId))
  const [selectedUploadFile, setSelectedUploadFile] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [editingAssignmentId, setEditingAssignmentId] = useState(null)
  const [editingPlannerId, setEditingPlannerId] = useState(null)
  const [editingReadingId, setEditingReadingId] = useState(null)
  const [editingImportantDateId, setEditingImportantDateId] = useState(null)
  const [editingFileId, setEditingFileId] = useState(null)

  useEffect(() => {
    if (!assignmentForm.childId) setAssignmentForm((current) => ({ ...current, childId: defaultChildId }))
    if (!plannerForm.childId) setPlannerForm((current) => ({ ...current, childId: defaultChildId }))
    if (!readingForm.childId) setReadingForm((current) => ({ ...current, childId: defaultChildId }))
    if (!importantDateForm.childId) setImportantDateForm((current) => ({ ...current, childId: defaultChildId }))
    if (!fileForm.childId) setFileForm((current) => ({ ...current, childId: defaultChildId }))
  }, [assignmentForm.childId, defaultChildId, fileForm.childId, importantDateForm.childId, plannerForm.childId, readingForm.childId])

  const resetAssignmentForm = () => {
    setAssignmentForm(createEmptyAssignment(defaultChildId))
    setEditingAssignmentId(null)
  }

  const resetPlannerForm = () => {
    setPlannerForm(createEmptyPlannerTask(defaultChildId))
    setEditingPlannerId(null)
  }

  const resetReadingForm = () => {
    setReadingForm(createEmptyReadingLog(defaultChildId))
    setEditingReadingId(null)
  }

  const resetImportantDateForm = () => {
    setImportantDateForm(createEmptyImportantDate(defaultChildId))
    setEditingImportantDateId(null)
  }

  const resetFileForm = () => {
    setFileForm(createEmptyFileRecord(defaultChildId))
    setSelectedUploadFile(null)
    setEditingFileId(null)
    setFileInputKey((current) => current + 1)
  }

  return {
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
  }
}
