import SectionHeader from './SectionHeader'
import { EmptyState, InputField, SelectField } from './ui'
import { formatDate, getWeekRange } from '../lib/helpers'

function FilesView({
  children,
  files,
  form,
  editingId,
  selectedFileName,
  onFormChange,
  onFileChange,
  onSubmit,
  onDelete,
  onEdit,
  onCancelEdit,
}) {
  const groupedFiles = files.reduce((groups, file) => {
    if (!groups[file.childName]) groups[file.childName] = []
    groups[file.childName].push(file)
    return groups
  }, {})

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
      <SectionHeader
        title="Files"
        description="Store teacher schedules and study documents as local file records for now, with child and week grouping."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[1.75rem] bg-canvas p-5">
          <h3 className="font-display text-2xl text-ink">{editingId ? 'Edit file record' : 'Add file record'}</h3>
          <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
            <SelectField label="Child" value={form.childId} onChange={(value) => onFormChange('childId', value)}>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </SelectField>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Teacher" value={form.teacher} onChange={(value) => onFormChange('teacher', value)} placeholder="Teacher name" />
              <InputField label="Week of" type="date" value={form.weekOf} onChange={(value) => onFormChange('weekOf', value)} helper="Use Monday if you can" />
            </div>
            <InputField label="File name" value={form.fileName} onChange={(value) => onFormChange('fileName', value)} placeholder="schedule.pdf" helper="Required" />
            <label className="space-y-2 text-sm font-medium text-slate-600">
              <span>File</span>
              <input
                name="upload"
                type="file"
                onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
                className="block w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-plum/10 file:px-4 file:py-2 file:font-medium file:text-plum"
              />
            </label>
            {selectedFileName ? <p className="text-sm text-slate-500">Selected file: {selectedFileName}</p> : null}
            <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
              {editingId ? 'Save file record' : 'Save file record'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : null}
          </form>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedFiles).length === 0 ? (
            <EmptyState
              title="No files uploaded yet"
              description="Add a teacher schedule or study handout and it will appear here grouped by child."
            />
          ) : (
            Object.entries(groupedFiles).map(([childName, groupFiles]) => (
              <div key={childName} className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <div className="mb-4">
                  <h3 className="font-display text-2xl text-ink">{childName}</h3>
                  <p className="text-sm text-slate-500">{groupFiles.length} file records saved</p>
                </div>
                <div className="space-y-4">
                  {groupFiles.map((file) => (
                    <div key={file.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-ink">{file.fileName}</p>
                          <p className="text-sm text-slate-500">
                            Week of {getWeekRange(file.weekOf)} · {file.teacher || 'Teacher not listed'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {file.sizeLabel} · Uploaded {formatDate(file.uploadedAt.slice(0, 10))}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(file.id)}
                            className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(file.id)}
                            className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default FilesView
