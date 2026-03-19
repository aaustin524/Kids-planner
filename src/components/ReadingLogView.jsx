import SectionHeader from './SectionHeader'
import { EmptyState, InputField, SelectField, TextAreaField } from './ui'
import { formatDate, getWeekRange, sumReadingMinutes } from '../lib/helpers'

function ReadingLogView({
  children,
  readingLogs,
  form,
  editingId,
  onFormChange,
  onSubmit,
  onDelete,
  onEdit,
  onCancelEdit,
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
      <SectionHeader
        title="Reading Log"
        description="Track minutes, pages, and notes while keeping each child’s weekly total easy to scan."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[1.75rem] bg-canvas p-5">
          <h3 className="font-display text-2xl text-ink">{editingId ? 'Edit reading session' : 'Add reading session'}</h3>
          <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
            <SelectField label="Child" value={form.childId} onChange={(value) => onFormChange('childId', value)}>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </SelectField>
            <InputField label="Book title" value={form.bookTitle} onChange={(value) => onFormChange('bookTitle', value)} placeholder="Current book" helper="Required" />
            <div className="grid gap-3 md:grid-cols-3">
              <InputField label="Date" type="date" value={form.date} onChange={(value) => onFormChange('date', value)} />
              <InputField label="Minutes read" type="number" min="0" value={form.minutesRead} onChange={(value) => onFormChange('minutesRead', value)} />
              <InputField label="Pages read" type="number" min="0" value={form.pagesRead} onChange={(value) => onFormChange('pagesRead', value)} />
            </div>
            <TextAreaField label="Notes" value={form.notes} onChange={(value) => onFormChange('notes', value)} placeholder="Short note about focus, reaction, or reading stamina" />
            <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
              {editingId ? 'Save reading log' : 'Add reading log'}
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

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child) => (
              <div key={child.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-500">{child.name}</p>
                <p className="mt-2 font-display text-3xl text-ink">{sumReadingMinutes(readingLogs, child.id)} min</p>
                <p className="mt-1 text-sm text-slate-500">This week</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {readingLogs.length === 0 ? (
              <EmptyState
                title="No reading sessions yet this week"
                description="Add the first reading entry to see totals and weekly progress fill in."
              />
            ) : (
              readingLogs.map((entry) => (
                <div key={entry.id} className="rounded-[1.75rem] border border-white bg-white p-5 shadow-soft">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-display text-2xl text-ink">{entry.bookTitle}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {entry.childName} · {formatDate(entry.date)} · {entry.minutesRead} min · {entry.pagesRead} pages
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Week of {getWeekRange(entry.date)}</p>
                      {entry.notes ? <p className="mt-2 text-sm text-slate-600">{entry.notes}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(entry.id)}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ReadingLogView
